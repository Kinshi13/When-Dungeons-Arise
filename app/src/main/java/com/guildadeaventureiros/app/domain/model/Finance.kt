package com.guildadeaventureiros.app.domain.model

import java.time.Instant
import java.time.LocalDate

/** Valores monetários em centavos (Long) para evitar problemas de ponto flutuante. */
data class Expense(
    val id: Long = 0,
    val amountCents: Long,
    val description: String,
    val date: LocalDate,
)

data class Bill(
    val id: Long = 0,
    val description: String,
    val amountCents: Long,
    val dueDate: LocalDate,
    val paid: Boolean = false,
    val paidAt: Instant? = null,
)

data class Receivable(
    val id: Long = 0,
    val description: String,
    val amountCents: Long,
    val expectedDate: LocalDate,
    val received: Boolean = false,
)
