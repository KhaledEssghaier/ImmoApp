import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:go_router/go_router.dart';

// Conditional import for web
import 'stripe_checkout_webview_stub.dart'
    if (dart.library.html) 'stripe_checkout_webview_web.dart';

class StripeCheckoutWebView extends StatefulWidget {
  final String checkoutUrl;
  final String paymentType;

  const StripeCheckoutWebView({
    super.key,
    required this.checkoutUrl,
    required this.paymentType,
  });

  @override
  State<StripeCheckoutWebView> createState() => _StripeCheckoutWebViewState();
}

class _StripeCheckoutWebViewState extends State<StripeCheckoutWebView> {
  late final WebViewController? _controller;
  bool _isLoading = true;
  String _currentUrl = '';

  @override
  void initState() {
    super.initState();
    if (!kIsWeb) {
      _initializeWebView();
    }
  }

  void _initializeWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
              _currentUrl = url;
            });
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
              _currentUrl = url;
            });

            // Check if payment is successful or cancelled
            if (url.contains('payment/success')) {
              _handlePaymentSuccess();
            } else if (url.contains('payment/cancel')) {
              _handlePaymentCancelled();
            }
          },
          onNavigationRequest: (NavigationRequest request) {
            // Allow all Stripe related navigation
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.checkoutUrl));
  }

  void _handlePaymentSuccess() {
    // Show success message
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Payment successful! Your credits have been added.'),
        backgroundColor: Colors.green,
        duration: Duration(seconds: 3),
      ),
    );

    // Wait a moment then return to previous screen
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        context.pop(true); // Return true to indicate success
      }
    });
  }

  void _handlePaymentCancelled() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Payment cancelled'),
        backgroundColor: Colors.orange,
      ),
    );

    // Return to previous screen
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) {
        context.pop(false);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    // For web platform, open payment link in new tab using dart:html
    if (kIsWeb) {
      // Open the URL immediately
      WidgetsBinding.instance.addPostFrameCallback((_) {
        openPaymentUrlWeb(widget.checkoutUrl);
      });

      return Scaffold(
        backgroundColor: const Color(0xFF0A1929),
        appBar: AppBar(
          backgroundColor: const Color(0xFF0A1929),
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.close, color: Colors.white),
            onPressed: () => context.pop(),
          ),
          title: const Text(
            'Complete Payment',
            style: TextStyle(color: Colors.white, fontSize: 18),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.payment, size: 80, color: Color(0xFF3ABAEC)),
                const SizedBox(height: 32),
                const Text(
                  'Payment page opened in a new tab',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Complete your payment in the new tab, then return here.',
                  style: TextStyle(color: Colors.white70, fontSize: 14),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: () {
                    openPaymentUrlWeb(widget.checkoutUrl);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3ABAEC),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 48,
                      vertical: 16,
                    ),
                  ),
                  child: const Text(
                    'Reopen Payment Page',
                    style: TextStyle(fontSize: 16, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () => context.pop(),
                  child: const Text(
                    'Close',
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    // For mobile platforms, use WebView
    return Scaffold(
      backgroundColor: const Color(0xFF0A1929),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A1929),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () {
            _showCancelConfirmation();
          },
        ),
        title: Text(
          widget.paymentType == 'subscription'
              ? 'Subscription Payment'
              : 'Single Post Payment',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          if (_controller != null) WebViewWidget(controller: _controller),
          if (_isLoading)
            Container(
              color: const Color(0xFF0A1929),
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(color: Color(0xFF3ABAEC)),
                    SizedBox(height: 16),
                    Text(
                      'Loading payment page...',
                      style: TextStyle(color: Colors.white70, fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showCancelConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A2332),
        title: const Text(
          'Cancel Payment?',
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          'Are you sure you want to cancel this payment?',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('No, Continue'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              context.pop(false); // Close WebView
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );
  }
}
