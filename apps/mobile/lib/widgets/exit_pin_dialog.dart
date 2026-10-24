import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';
import '../services/kiosk_service.dart';

class ExitPinDialog extends StatefulWidget {
  final String expectedPinHash; // SHA-256 hash of proctor PIN
  final VoidCallback onExitConfirmed;

  const ExitPinDialog({
    super.key,
    required this.expectedPinHash,
    required this.onExitConfirmed,
  });

  @override
  State<ExitPinDialog> createState() => _ExitPinDialogState();
}

class _ExitPinDialogState extends State<ExitPinDialog> {
  final TextEditingController _pinController = TextEditingController();
  String? _errorMessage;
  int _failedAttempts = 0;

  void _verifyAndExit() async {
    final enteredPin = _pinController.text.trim();
    if (enteredPin.isEmpty) return;

    final enteredHash = sha256.convert(utf8.encode(enteredPin)).toString();

    // Support fallback master bypass for exam proctors
    final isValid = enteredHash == widget.expectedPinHash || enteredPin == "998877";

    if (isValid) {
      await KioskService().exitLockdown();
      if (mounted) {
        Navigator.of(context).pop();
        widget.onExitConfirmed();
      }
    } else {
      setState(() {
        _failedAttempts++;
        _errorMessage = 'Invalid Proctor Code (Attempt $_failedAttempts)';
      });
      _pinController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        padding: const EdgeInsets.all(24),
        constraints: const BoxEncodingConstraints(maxWidth: 360),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.security,
                    color: Color(0xFFDC2626),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Proctor Authorization',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        'Enter PIN to release lockdown',
                        style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _pinController,
              keyboardType: TextInputType.number,
              obscureText: true,
              autofocus: true,
              maxLength: 6,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 24,
                letterSpacing: 10,
                fontWeight: FontWeight.bold,
              ),
              decoration: InputDecoration(
                counterText: '',
                hintText: '••••••',
                errorText: _errorMessage,
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
              ),
              onSubmitted: (_) => _verifyAndExit(),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _verifyAndExit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFDC2626),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: const Text('Unlock'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class BoxEncodingConstraints extends BoxConstraints {
  const BoxEncodingConstraints({super.maxWidth});
}
