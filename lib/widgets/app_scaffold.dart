import 'package:flutter/material.dart';
import '../widgets/simple_bottom_nav_bar.dart';

class AppScaffold extends StatelessWidget {
  final Widget body;
  final PreferredSizeWidget? appBar;
  final int currentIndex;
  final Color? backgroundColor;
  final FloatingActionButton? floatingActionButton;
  final Widget? drawer;
  final bool showNavBar;

  const AppScaffold({
    super.key,
    required this.body,
    this.appBar,
    this.currentIndex = 0,
    this.backgroundColor,
    this.floatingActionButton,
    this.drawer,
    this.showNavBar = true,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: appBar,
      body: body,
      floatingActionButton: floatingActionButton,
      drawer: drawer,
      bottomNavigationBar: showNavBar
          ? SimpleBottomNavBar(currentIndex: currentIndex)
          : null,
    );
  }
}
