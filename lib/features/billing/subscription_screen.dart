import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../auth/providers/auth_provider.dart';

// Subscription model
class UserSubscription {
  final int totalCredits;
  final int remainingCredits;
  final double price;
  final bool isActive;
  final DateTime? createdAt;

  UserSubscription({
    required this.totalCredits,
    required this.remainingCredits,
    required this.price,
    required this.isActive,
    this.createdAt,
  });

  factory UserSubscription.fromJson(Map<String, dynamic> json) {
    return UserSubscription(
      totalCredits: json['totalCredits'] ?? 0,
      remainingCredits: json['remainingCredits'] ?? 0,
      price: (json['price'] ?? 0).toDouble(),
      isActive: json['isActive'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
    );
  }
}

// Payment history model
class PaymentHistory {
  final String id;
  final String type;
  final double amount;
  final String status;
  final DateTime createdAt;

  PaymentHistory({
    required this.id,
    required this.type,
    required this.amount,
    required this.status,
    required this.createdAt,
  });

  factory PaymentHistory.fromJson(Map<String, dynamic> json) {
    return PaymentHistory(
      id: json['_id'] ?? '',
      type: json['type'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      status: json['status'] ?? '',
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}

// Provider for subscription data - Auto refreshable
final subscriptionProvider = FutureProvider.family
    .autoDispose<UserSubscription?, String>((ref, userId) async {
      try {
        final storage = ref.read(storageServiceProvider);
        final token = await storage.getAccessToken();

        if (token == null) {
          print('❌ No auth token available');
          return null;
        }

        print('📡 Fetching subscription for user: $userId');
        print(
          '🔑 Token (first 20 chars): ${token.substring(0, token.length > 20 ? 20 : token.length)}...',
        );
        final response = await http.get(
          Uri.parse(
            'http://localhost:3000/api/v1/billing/subscriptions/$userId',
          ),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        );

        print('📊 Subscription response status: ${response.statusCode}');
        print('📊 Subscription response body: ${response.body}');

        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          final subscription = UserSubscription.fromJson(data);
          print(
            '✅ Subscription loaded: ${subscription.remainingCredits}/${subscription.totalCredits} credits',
          );
          return subscription;
        }
        print('⚠️ No subscription found (${response.statusCode})');
        return null;
      } catch (e) {
        print('❌ Error fetching subscription: $e');
        return null;
      }
    });

// Provider for payment history - Auto refreshable
final paymentHistoryProvider = FutureProvider.family
    .autoDispose<List<PaymentHistory>, String>((ref, userId) async {
      try {
        final storage = ref.read(storageServiceProvider);
        final token = await storage.getAccessToken();

        if (token == null) {
          print('❌ No auth token available');
          return [];
        }

        print('📡 Fetching payment history for user: $userId');
        final response = await http.get(
          Uri.parse(
            'http://localhost:3000/api/v1/billing/payments/user/$userId',
          ),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        );

        print('📊 Payment history response status: ${response.statusCode}');

        if (response.statusCode == 200) {
          final responseData = json.decode(response.body);
          print('📊 Payment history data: $responseData');

          // Backend returns { data: Payment[], total: number }
          if (responseData is Map && responseData.containsKey('data')) {
            final List<dynamic> data = responseData['data'];
            print('✅ Loaded ${data.length} payment(s)');
            return data.map((json) => PaymentHistory.fromJson(json)).toList();
          }
          return [];
        }
        print('⚠️ No payment history found');
        return [];
      } catch (e) {
        print('❌ Error fetching payment history: $e');
        return [];
      }
    });

class SubscriptionScreen extends ConsumerWidget {
  const SubscriptionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final userId = authState.user?.id ?? '';

    final subscriptionAsync = ref.watch(subscriptionProvider(userId));
    final paymentsAsync = ref.watch(paymentHistoryProvider(userId));

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back,
            color: Theme.of(context).colorScheme.onSurface,
          ),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/home');
            }
          },
        ),
        title: Text(
          'Subscription & Credits',
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurface,
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(subscriptionProvider(userId));
          ref.invalidate(paymentHistoryProvider(userId));
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Credits Card
                subscriptionAsync.when(
                  data: (subscription) =>
                      _buildCreditsCard(context, subscription),
                  loading: () => Center(
                    child: CircularProgressIndicator(
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  error: (error, stack) =>
                      _buildErrorCard(context, error.toString()),
                ),
                const SizedBox(height: 24),

                // Purchase Options
                Text(
                  'Get More Credits',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 16),
                _buildPurchaseButton(context),
                const SizedBox(height: 32),

                // Payment History
                Text(
                  'Payment History',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 16),
                paymentsAsync.when(
                  data: (payments) => _buildPaymentHistory(context, payments),
                  loading: () => Center(
                    child: CircularProgressIndicator(
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  error: (error, stack) => Text(
                    'Error loading history: $error',
                    style: const TextStyle(color: Colors.red),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCreditsCard(
    BuildContext context,
    UserSubscription? subscription,
  ) {
    final remainingCredits = subscription?.remainingCredits ?? 0;
    final isActive = subscription?.isActive ?? false;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isActive && remainingCredits > 0
              ? [
                  Theme.of(context).colorScheme.primary,
                  Theme.of(context).colorScheme.primary.withOpacity(0.7),
                ]
              : [Colors.grey.shade700, Colors.grey.shade800],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Available Credits',
                style: TextStyle(color: Colors.white70, fontSize: 16),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: isActive && remainingCredits > 0
                      ? Colors.green
                      : Colors.red,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  isActive && remainingCredits > 0 ? 'ACTIVE' : 'INACTIVE',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Text(
                '$remainingCredits',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 48,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'credits',
                style: TextStyle(color: Colors.white70, fontSize: 20),
              ),
            ],
          ),
          if (subscription != null && subscription.totalCredits > 0) ...[
            const SizedBox(height: 16),
            //Text(
            //'${subscription.totalCredits - remainingCredits} of ${subscription.totalCredits} used',
            //style: const TextStyle(color: Colors.white60, fontSize: 14),
            //),
          ],
        ],
      ),
    );
  }

  Widget _buildErrorCard(BuildContext context, String error) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.red.shade900.withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.red.shade700),
      ),
      child: Column(
        children: [
          const Icon(Icons.error_outline, color: Colors.red, size: 48),
          const SizedBox(height: 16),
          Text(
            'No active subscription',
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurface,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Get credits to start posting properties',
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPurchaseButton(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/payment-selection'),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Theme.of(context).colorScheme.primary,
              Theme.of(context).colorScheme.primary.withOpacity(0.8),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: const [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Buy Credits',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Choose your payment option',
                  style: TextStyle(color: Colors.white70, fontSize: 14),
                ),
              ],
            ),
            Icon(Icons.arrow_forward_ios, color: Colors.white, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentHistory(
    BuildContext context,
    List<PaymentHistory> payments,
  ) {
    if (payments.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Center(
          child: Column(
            children: [
              Icon(
                Icons.receipt_long_outlined,
                size: 48,
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.3),
              ),
              const SizedBox(height: 16),
              Text(
                'No payment history',
                style: TextStyle(
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withOpacity(0.5),
                  fontSize: 16,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: payments
          .map((payment) => _buildPaymentItem(context, payment))
          .toList(),
    );
  }

  Widget _buildPaymentItem(BuildContext context, PaymentHistory payment) {
    IconData icon;
    Color iconColor;

    switch (payment.status.toLowerCase()) {
      case 'success':
        icon = Icons.check_circle;
        iconColor = Colors.green;
        break;
      case 'pending':
        icon = Icons.hourglass_empty;
        iconColor = Colors.orange;
        break;
      case 'failed':
        icon = Icons.error;
        iconColor = Colors.red;
        break;
      default:
        icon = Icons.info;
        iconColor = Colors.grey;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  payment.type == 'subscription'
                      ? 'Subscription (10 credits)'
                      : 'Single Post',
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _formatDate(payment.createdAt),
                  style: TextStyle(
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withOpacity(0.5),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Text(
            '\$${payment.amount.toStringAsFixed(2)}',
            style: TextStyle(
              color: Theme.of(context).colorScheme.primary,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
