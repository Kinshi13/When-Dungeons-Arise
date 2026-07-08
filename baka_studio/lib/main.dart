import 'package:flutter/material.dart';

import 'app.dart';
import 'data/supabase/supabase_bootstrap.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await bootstrapSupabase();
  runApp(const BakaStudioApp());
}
