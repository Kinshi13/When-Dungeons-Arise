package com.guildadeaventureiros.app.data.db.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "expenses")
data class ExpenseEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val amountCents: Long,
    val description: String,
    val dateEpochDay: Long,
)

@Entity(tableName = "bills")
data class BillEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val description: String,
    val amountCents: Long,
    val dueDateEpochDay: Long,
    val paid: Boolean,
    val paidAtEpochMilli: Long?,
)

@Entity(tableName = "receivables")
data class ReceivableEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val description: String,
    val amountCents: Long,
    val expectedDateEpochDay: Long,
    val received: Boolean,
)
