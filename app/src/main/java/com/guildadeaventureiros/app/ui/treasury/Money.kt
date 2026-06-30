package com.guildadeaventureiros.app.ui.treasury

import java.util.Locale
import kotlin.math.roundToLong

fun formatCents(cents: Long): String {
    val reais = cents / 100.0
    return String.format(Locale.Builder().setLanguage("pt").setRegion("BR").build(), "R$ %,.2f", reais)
}

fun parseCentsOrNull(text: String): Long? {
    val normalized = text.trim().replace(",", ".")
    val value = normalized.toDoubleOrNull() ?: return null
    if (value < 0) return null
    return (value * 100).roundToLong()
}
