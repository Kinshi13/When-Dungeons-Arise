package com.guildadeaventureiros.app.data.db.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "missions")
data class MissionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val description: String?,
    val difficulty: String,
    val dueDateEpochDay: Long?,
    val status: String,
    val createdAtEpochMilli: Long,
    val completedAtEpochMilli: Long?,
    val completedLate: Boolean,
)
