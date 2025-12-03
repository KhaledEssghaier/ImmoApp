import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../data/models/message_model.dart';

class MessageBubble extends StatelessWidget {
  final MessageModel message;
  final bool isMe;
  final VoidCallback? onRetry;
  final Function(String)? onEdit;

  const MessageBubble({
    super.key,
    required this.message,
    required this.isMe,
    this.onRetry,
    this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: isMe
            ? MainAxisAlignment.end
            : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMe) const SizedBox(width: 8),
          Flexible(
            child: GestureDetector(
              onLongPress: isMe && onEdit != null
                  ? () => _showEditDialog(context)
                  : null,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: isMe ? const Color(0xFF005C4B) : const Color(0xFF1F2C34),
                  borderRadius: BorderRadius.only(
                    topLeft: const Radius.circular(12),
                    topRight: const Radius.circular(12),
                    bottomLeft: Radius.circular(isMe ? 12 : 2),
                    bottomRight: Radius.circular(isMe ? 2 : 12),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: isMe
                      ? CrossAxisAlignment.end
                      : CrossAxisAlignment.start,
                  children: [
                    Text(
                      message.text,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (message.edited == true) ...[
                          const Text(
                            'edited',
                            style: TextStyle(
                              color: Colors.white38,
                              fontSize: 10,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                          const SizedBox(width: 4),
                        ],
                        Text(
                          DateFormat.Hm().format(message.createdAt),
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 11,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                        if (isMe) ...[
                          const SizedBox(width: 6),
                          _buildStatusIcon(),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (isMe) const SizedBox(width: 8),
        ],
      ),
    );
  }

  Widget _buildStatusIcon() {
    switch (message.status) {
      case MessageStatus.sending:
        return SizedBox(
          width: 14,
          height: 14,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            valueColor: AlwaysStoppedAnimation<Color>(
              Colors.white.withOpacity(0.8),
            ),
          ),
        );
      case MessageStatus.failed:
        return GestureDetector(
          onTap: onRetry,
          child: Container(
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              color: Colors.red[400],
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.priority_high,
              size: 12,
              color: Colors.white,
            ),
          ),
        );
      case MessageStatus.sent:
        return Icon(
          Icons.check,
          size: 16,
          color: Colors.white.withOpacity(0.8),
        );
      case MessageStatus.delivered:
        return Icon(
          Icons.done_all,
          size: 16,
          color: Colors.white.withOpacity(0.8),
        );
      case MessageStatus.read:
        return const Icon(
          Icons.done_all,
          size: 16,
          color: Colors.lightBlueAccent,
        );
    }
  }

  void _showEditDialog(BuildContext context) {
    final controller = TextEditingController(text: message.text);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1F2C34),
        title: const Text(
          'Edit Message',
          style: TextStyle(color: Colors.white),
        ),
        content: TextField(
          controller: controller,
          maxLines: 5,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'Enter new message',
            hintStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
            enabledBorder: OutlineInputBorder(
              borderSide: BorderSide(color: Colors.white.withOpacity(0.3)),
              borderRadius: BorderRadius.circular(8),
            ),
            focusedBorder: const OutlineInputBorder(
              borderSide: BorderSide(color: Color(0xFF3ABAEC)),
              borderRadius: BorderRadius.all(Radius.circular(8)),
            ),
          ),
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              final newText = controller.text.trim();
              if (newText.isNotEmpty && newText != message.text) {
                onEdit?.call(newText);
              }
              Navigator.pop(context);
            },
            style: TextButton.styleFrom(
              foregroundColor: const Color(0xFF3ABAEC),
            ),
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}
