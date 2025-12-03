import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../auth/providers/auth_provider.dart';
import 'stripe_checkout_webview.dart';

class PaymentSelectionScreen extends ConsumerWidget {
  const PaymentSelectionScreen({super.key});

  Future<void> _createPaymentSession(
    BuildContext context,
    WidgetRef ref,
    String paymentType,
  ) async {
    final authState = ref.read(authProvider);
    final userId = authState.user?.id;

    if (userId == null) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please log in to continue'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return;
    }

    try {
      // Show loading
      if (context.mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => Center(
            child: CircularProgressIndicator(
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
        );
      }

      print('Creating payment session for userId: $userId, type: $paymentType');

      final response = await http.post(
        Uri.parse('http://localhost:3012/billing/payments/create-session'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'userId': userId, 'type': paymentType}),
      );

      print('Response status: ${response.statusCode}');
      print('Response body: ${response.body}');

      if (context.mounted) {
        Navigator.pop(context); // Close loading dialog
      }

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = json.decode(response.body);
        final checkoutUrl = data['url'];

        // Open Stripe checkout in WebView
        if (context.mounted) {
          print('DEBUG: Opening WebView with URL: $checkoutUrl');
          final result = await Navigator.push<bool>(
            context,
            MaterialPageRoute(
              builder: (context) => StripeCheckoutWebView(
                checkoutUrl: checkoutUrl,
                paymentType: paymentType,
              ),
            ),
          );

          // If payment was successful, navigate back
          if (result == true && context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'Credits added successfully! You can now post properties.',
                ),
                backgroundColor: Colors.green,
              ),
            );
            // Return to previous screen
            context.pop();
          }
        }
      } else {
        final errorMessage = response.statusCode == 400
            ? 'Invalid request: ${response.body}'
            : 'Failed to create payment session (${response.statusCode})';
        throw Exception(errorMessage);
      }
    } catch (e) {
      print('Error creating payment session: $e');
      if (context.mounted) {
        Navigator.of(
          context,
          rootNavigator: true,
        ).pop(); // Ensure loading dialog is closed
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Choose Payment Option',
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurface,
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Select Your Plan',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurface,
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Choose the option that best fits your needs',
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 32),

            // Subscription Card (Recommended)
            _buildPaymentCard(
              context: context,
              ref: ref,
              title: 'Subscription',
              subtitle: '10 Property Listings',
              price: '\$50',
              priceDescription: 'one-time payment',
              features: [
                '10 property credits',
                'No expiration date',
                'Priority support',
                'Best value for multiple listings',
              ],
              color: Theme.of(context).colorScheme.primary,
              isRecommended: true,
              paymentType: 'subscription',
              icon: Icons.workspace_premium,
            ),
            const SizedBox(height: 20),

            // Single Post Card
            _buildPaymentCard(
              context: context,
              ref: ref,
              title: 'Single Post',
              subtitle: '1 Property Listing',
              price: '\$10',
              priceDescription: 'per listing',
              features: [
                '1 property credit',
                'Instant activation',
                'Full listing features',
                'Perfect for single property',
              ],
              color: Colors.grey.shade700,
              isRecommended: false,
              paymentType: 'single_post',
              icon: Icons.home_work,
            ),
            const SizedBox(height: 32),

            // Info Section
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        color: Theme.of(context).colorScheme.primary,
                        size: 24,
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'How it works',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildInfoItem(
                    '1. Choose your plan above',
                    Icons.check_circle_outline,
                    context,
                  ),
                  _buildInfoItem(
                    '2. Complete payment with Stripe',
                    Icons.payment,
                    context,
                  ),
                  _buildInfoItem(
                    '3. Credits added instantly',
                    Icons.bolt,
                    context,
                  ),
                  _buildInfoItem(
                    '4. Start posting properties!',
                    Icons.home,
                    context,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Security Notice
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.lock_outline,
                  color: Colors.white.withOpacity(0.5),
                  size: 16,
                ),
                const SizedBox(width: 8),
                Text(
                  'Secure payment powered by Stripe',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.5),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentCard({
    required BuildContext context,
    required WidgetRef ref,
    required String title,
    required String subtitle,
    required String price,
    required String priceDescription,
    required List<String> features,
    required Color color,
    required bool isRecommended,
    required String paymentType,
    required IconData icon,
  }) {
    return GestureDetector(
      onTap: () => _createPaymentSession(context, ref, paymentType),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [color, color.withOpacity(0.7)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Stack(
          children: [
            // Recommended Badge
            if (isRecommended)
              Positioned(
                top: 16,
                right: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.amber,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.star, size: 12, color: Colors.black87),
                      SizedBox(width: 3),
                      Text(
                        'BEST',
                        style: TextStyle(
                          color: Colors.black87,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(icon, color: Colors.white, size: 24),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              subtitle,
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 12,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Price
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Flexible(
                        flex: 2,
                        child: Text(
                          price,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 36,
                            fontWeight: FontWeight.bold,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Flexible(
                        flex: 3,
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Text(
                            priceDescription,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
                            overflow: TextOverflow.ellipsis,
                            maxLines: 2,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Features
                  ...features.map(
                    (feature) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.check_circle,
                            color: Colors.white,
                            size: 16,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              feature,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Button
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: Text(
                        'Choose ${title}',
                        style: TextStyle(
                          color: color,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoItem(String text, IconData icon, BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, color: Theme.of(context).colorScheme.primary, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.8),
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
