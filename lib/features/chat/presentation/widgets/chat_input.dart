import 'package:flutter/material.dart';
import 'dart:async';

class ChatInput extends StatefulWidget {
  final Function(String) onSendMessage;
  final Function(bool) onTyping;
  final VoidCallback? onAttachment;

  const ChatInput({
    super.key,
    required this.onSendMessage,
    required this.onTyping,
    this.onAttachment,
  });

  @override
  State<ChatInput> createState() => _ChatInputState();
}

class _ChatInputState extends State<ChatInput> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  Timer? _typingTimer;
  bool _isTyping = false;

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    _typingTimer?.cancel();
    super.dispose();
  }

  void _handleTextChange(String text) {
    if (text.isNotEmpty && !_isTyping) {
      _isTyping = true;
      widget.onTyping(true);
    }

    _typingTimer?.cancel();
    _typingTimer = Timer(const Duration(seconds: 3), () {
      if (_isTyping) {
        _isTyping = false;
        widget.onTyping(false);
      }
    });
  }

  void _handleSend() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    widget.onSendMessage(text);
    _controller.clear();

    if (_isTyping) {
      _isTyping = false;
      widget.onTyping(false);
    }

    _typingTimer?.cancel();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      color: const Color(0xFF1F2C34),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (widget.onAttachment != null)
            Container(
              margin: const EdgeInsets.only(right: 8, bottom: 4),
              decoration: const BoxDecoration(
                color: Color(0xFF1F2C34),
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: const Icon(Icons.add, color: Colors.white70, size: 26),
                onPressed: widget.onAttachment,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
              ),
            ),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFF2A3942),
                borderRadius: BorderRadius.circular(22),
              ),
              child: TextField(
                controller: _controller,
                focusNode: _focusNode,
                onChanged: _handleTextChange,
                decoration: const InputDecoration(
                  hintText: 'Type a message...',
                  hintStyle: TextStyle(color: Colors.white38),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 12,
                  ),
                ),
                maxLines: 5,
                minLines: 1,
                textInputAction: TextInputAction.newline,
                style: const TextStyle(fontSize: 15, color: Colors.white),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            decoration: const BoxDecoration(
              color: Color(0xFF00A884),
              shape: BoxShape.circle,
            ),
            child: IconButton(
              icon: const Icon(
                Icons.send_rounded,
                color: Colors.white,
                size: 20,
              ),
              onPressed: _handleSend,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 46, minHeight: 46),
            ),
          ),
        ],
      ),
    );
  }
}
