package com.guildadeaventureiros.app.domain.model

import java.time.Instant
import java.time.LocalDate

enum class MissionDifficulty { SIMPLE, MEDIUM, IMPORTANT }
enum class MissionStatus { PENDING, ACCEPTED, COMPLETED }

data class Mission(
    val id: Long = 0,
    val title: String,
    val description: String? = null,
    val difficulty: MissionDifficulty,
    val dueDate: LocalDate? = null,
    val status: MissionStatus = MissionStatus.PENDING,
    val createdAt: Instant = Instant.now(),
    val completedAt: Instant? = null,
    val completedLate: Boolean = false,
)
