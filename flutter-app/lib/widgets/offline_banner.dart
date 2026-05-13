import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/offline_queue.dart';

class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<OfflineQueue>(
      builder: (_, queue, __) {
        if (queue.isOnline && queue.queueLength == 0) {
          return const SizedBox.shrink();
        }
        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          color: queue.isOnline ? const Color(0xFF3B6D11) : const Color(0xFFA32D2D),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              Icon(
                queue.isOnline ? Icons.cloud_upload_outlined : Icons.wifi_off_rounded,
                color: Colors.white,
                size: 16,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  queue.isOnline
                      ? '${queue.queueLength} action${queue.queueLength > 1 ? 's' : ''} syncing...'
                      : queue.queueLength > 0
                          ? 'Offline — ${queue.queueLength} action${queue.queueLength > 1 ? 's' : ''} queued'
                          : 'No internet connection',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              if (queue.isOnline && queue.queueLength > 0)
                GestureDetector(
                  onTap: () => queue.retryNow(),
                  child: const Text(
                    'Sync now',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
