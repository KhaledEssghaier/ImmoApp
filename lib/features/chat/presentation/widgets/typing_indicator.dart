import 'package:flutter/material.dart';

class TypingIndicator extends StatefulWidget {
  final List<String> userNames;

  const TypingIndicator({super.key, required this.userNames});

  @override
  State<TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<TypingIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.userNames.isEmpty) return const SizedBox.shrink();

    final displayText = widget.userNames.length == 1
        ? '${widget.userNames[0]} is typing...'
        : '${widget.userNames.length} people are typing...';

    return Container(
      padding: const EdgeInsets.all(8),
      child: Row(
        children: [
          AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              return Row(
                children: List.generate(3, (index) {
                  final delay = index * 0.3;
                  final value = (_controller.value + delay) % 1.0;
                  final opacity = (value < 0.5 ? value * 2 : (1 - value) * 2);

                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.grey.withOpacity(opacity),
                    ),
                  );
                }),
              );
            },
          ),
          const SizedBox(width: 8),
          Text(
            displayText,
            style: const TextStyle(
              fontSize: 12,
              color: Colors.grey,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }
}
