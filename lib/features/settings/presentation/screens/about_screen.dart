import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.primary,
        elevation: 4,
        shadowColor: Colors.black.withOpacity(0.3),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'About',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // App Logo and Name
          Center(
            child: Column(
              children: [
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Theme.of(context).colorScheme.primary,
                        Theme.of(context).colorScheme.primary.withOpacity(0.7),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Theme.of(
                          context,
                        ).colorScheme.primary.withOpacity(0.3),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.home_work,
                    size: 50,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'ImmoApp',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Version 1.0.0 (Build 1)',
                  style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          _buildSection(
            context,
            title: 'App Information',
            items: [
              _AboutItem(
                icon: Icons.info_outline,
                title: 'About ImmoApp',
                subtitle: 'Your trusted property marketplace',
                onTap: () {
                  _showAboutDialog(context);
                },
              ),
              _AboutItem(
                icon: Icons.star_outline,
                title: 'Version',
                subtitle: '1.0.0',
                onTap: () {},
              ),
              _AboutItem(
                icon: Icons.update_outlined,
                title: 'Check for Updates',
                subtitle: 'You are using the latest version',
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: const Text('You are using the latest version'),
                      backgroundColor: Theme.of(context).colorScheme.primary,
                    ),
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 24),

          _buildSection(
            context,
            title: 'Legal',
            items: [
              _AboutItem(
                icon: Icons.description_outlined,
                title: 'Terms of Service',
                subtitle: 'Read our terms and conditions',
                onTap: () {},
              ),
              _AboutItem(
                icon: Icons.privacy_tip_outlined,
                title: 'Privacy Policy',
                subtitle: 'How we handle your data',
                onTap: () {},
              ),
              _AboutItem(
                icon: Icons.gavel_outlined,
                title: 'Licenses',
                subtitle: 'Open source licenses',
                onTap: () {
                  showLicensePage(context: context);
                },
              ),
            ],
          ),
          const SizedBox(height: 24),

          _buildSection(
            context,
            title: 'Connect',
            items: [
              _AboutItem(
                icon: Icons.language,
                title: 'Website',
                subtitle: 'www.immoapp.com',
                onTap: () {
                  _launchURL('https://www.immoapp.com');
                },
              ),
              _AboutItem(
                icon: Icons.facebook,
                title: 'Facebook',
                subtitle: 'Follow us on Facebook',
                onTap: () {
                  _launchURL('https://www.facebook.com/immoapp');
                },
              ),
              _AboutItem(
                icon: Icons.email_outlined,
                title: 'Instagram',
                subtitle: '@immoapp',
                onTap: () {
                  _launchURL('https://www.instagram.com/immoapp');
                },
              ),
            ],
          ),
          const SizedBox(height: 24),

          _buildSection(
            context,
            title: 'Support Us',
            items: [
              _AboutItem(
                icon: Icons.star_rate,
                title: 'Rate on Play Store',
                subtitle: 'Help us with a 5-star rating',
                onTap: () {},
              ),
              _AboutItem(
                icon: Icons.share_outlined,
                title: 'Share App',
                subtitle: 'Tell your friends about ImmoApp',
                onTap: () {
                  // Implement share functionality
                },
              ),
            ],
          ),
          const SizedBox(height: 32),

          // Copyright
          Center(
            child: Column(
              children: [
                Text(
                  '© 2024 ImmoApp',
                  style: TextStyle(fontSize: 13, color: Colors.grey[500]),
                ),
                const SizedBox(height: 4),
                Text(
                  'Made with ❤️ for property seekers',
                  style: TextStyle(fontSize: 13, color: Colors.grey[500]),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildSection(
    BuildContext context, {
    required String title,
    required List<_AboutItem> items,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 12),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.grey[900],
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              for (int i = 0; i < items.length; i++) ...[
                items[i],
                if (i < items.length - 1)
                  Divider(height: 1, indent: 60, color: Colors.grey[200]),
              ],
            ],
          ),
        ),
      ],
    );
  }

  void _launchURL(String url) async {
    final Uri uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('About ImmoApp'),
        content: const SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'ImmoApp is your trusted property marketplace, connecting buyers, sellers, and renters in one seamless platform.',
                style: TextStyle(fontSize: 14),
              ),
              SizedBox(height: 16),
              Text('Features:', style: TextStyle(fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text('• Browse thousands of properties'),
              Text('• Save your favorite listings'),
              Text('• Connect with property owners'),
              Text('• Real-time notifications'),
              Text('• Secure messaging system'),
              SizedBox(height: 16),
              Text(
                'We strive to make property searching simple, secure, and enjoyable.',
                style: TextStyle(fontSize: 14),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}

class _AboutItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _AboutItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  icon,
                  color: Theme.of(context).colorScheme.primary,
                  size: 22,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey[900],
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: Colors.grey[400], size: 20),
            ],
          ),
        ),
      ),
    );
  }
}
