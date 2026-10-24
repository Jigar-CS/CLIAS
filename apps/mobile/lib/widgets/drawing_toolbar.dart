import 'package:flutter/material.dart';
import '../canvas/canvas_controller.dart';
import '../models/stroke.dart';
import '../services/sync_engine.dart';

class DrawingToolbar extends StatelessWidget {
  final CanvasController controller;
  final SyncEngine? syncEngine;

  const DrawingToolbar({
    super.key,
    required this.controller,
    this.syncEngine,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: AnimatedBuilder(
        animation: controller,
        builder: (context, _) {
          return Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Pen Tool
              _buildToolButton(
                icon: Icons.edit,
                label: 'Pen',
                isSelected: controller.currentTool == ToolType.pen,
                onTap: () => controller.setTool(ToolType.pen),
              ),
              const SizedBox(width: 4),

              // Highlighter Tool
              _buildToolButton(
                icon: Icons.border_color,
                label: 'Highlighter',
                isSelected: controller.currentTool == ToolType.highlighter,
                onTap: () => controller.setTool(ToolType.highlighter),
              ),
              const SizedBox(width: 4),

              // Eraser Tool
              _buildToolButton(
                icon: Icons.auto_fix_normal,
                label: 'Eraser',
                isSelected: controller.currentTool == ToolType.eraser,
                onTap: () => controller.setTool(ToolType.eraser),
              ),

              const SizedBox(width: 8),
              Container(width: 1, height: 24, color: const Color(0xFFCBD5E1)),
              const SizedBox(width: 8),

              // Color choices (Pen)
              if (controller.currentTool == ToolType.pen) ...[
                _buildColorDot(controller, Colors.black),
                _buildColorDot(controller, const Color(0xFF1E3A8A)), // Blue
                _buildColorDot(controller, const Color(0xFFDC2626)), // Red
                const SizedBox(width: 8),
                Container(width: 1, height: 24, color: const Color(0xFFCBD5E1)),
                const SizedBox(width: 8),
              ],

              // Undo / Redo
              IconButton(
                icon: const Icon(Icons.undo, size: 20),
                tooltip: 'Undo',
                onPressed: controller.canUndo ? controller.undo : null,
              ),
              IconButton(
                icon: const Icon(Icons.redo, size: 20),
                tooltip: 'Redo',
                onPressed: controller.canRedo ? controller.redo : null,
              ),

              const SizedBox(width: 8),
              Container(width: 1, height: 24, color: const Color(0xFFCBD5E1)),
              const SizedBox(width: 8),

              // Sync status pill
              if (syncEngine != null) _buildSyncPill(syncEngine!),
            ],
          );
        },
      ),
    );
  }

  Widget _buildToolButton({
    required IconData icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFEEF2FF) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: isSelected
              ? Border.all(color: const Color(0xFF6366F1), width: 1.5)
              : null,
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 18,
              color: isSelected ? const Color(0xFF4F46E5) : const Color(0xFF64748B),
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected ? const Color(0xFF4F46E5) : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildColorDot(CanvasController controller, Color color) {
    final isSelected = controller.penColor == color;
    return GestureDetector(
      onTap: () => controller.setColor(color),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 3),
        width: 18,
        height: 18,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          border: isSelected
              ? Border.all(color: const Color(0xFF4F46E5), width: 2)
              : Border.all(color: Colors.black12, width: 1),
        ),
      ),
    );
  }

  Widget _buildSyncPill(SyncEngine engine) {
    return ValueListenableBuilder<SyncStatus>(
      valueListenable: engine.statusNotifier,
      builder: (context, status, _) {
        Color dotColor;
        String text;

        switch (status) {
          case SyncStatus.connected:
          case SyncStatus.synced:
            dotColor = const Color(0xFF10B981);
            text = 'Synced';
            break;
          case SyncStatus.syncing:
            dotColor = const Color(0xFF3B82F6);
            text = 'Saving...';
            break;
          case SyncStatus.offlineBufferActive:
            dotColor = const Color(0xFFF59E0B);
            text = 'Offline Cache';
            break;
          case SyncStatus.connecting:
            dotColor = const Color(0xFF8B5CF6);
            text = 'Connecting';
            break;
          default:
            dotColor = const Color(0xFFEF4444);
            text = 'Disconnected';
        }

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: dotColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
              ),
              const SizedBox(width: 5),
              Text(
                text,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: dotColor,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
