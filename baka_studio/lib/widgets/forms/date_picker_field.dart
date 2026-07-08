import 'package:flutter/material.dart';

/// A tappable field showing an optional date, opening the platform date
/// picker and allowing clearing back to "no date".
class DatePickerField extends StatelessWidget {
  const DatePickerField({super.key, required this.label, required this.value, required this.onChanged});

  final String label;
  final DateTime? value;
  final ValueChanged<DateTime?> onChanged;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: value ?? DateTime.now(),
          firstDate: DateTime.now().subtract(const Duration(days: 365)),
          lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
        );
        if (picked != null) onChanged(picked);
      },
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          suffixIcon: value == null
              ? const Icon(Icons.calendar_today_outlined, size: 18)
              : IconButton(icon: const Icon(Icons.clear, size: 18), onPressed: () => onChanged(null)),
        ),
        child: Text(value == null ? 'Sem data' : '${value!.day.toString().padLeft(2, '0')}/${value!.month.toString().padLeft(2, '0')}/${value!.year}'),
      ),
    );
  }
}
