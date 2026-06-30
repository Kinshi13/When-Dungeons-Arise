package com.guildadeaventureiros.app.domain.model

import java.time.LocalDate

data class GameProfile(
    val level: Int = 1,
    val xp: Int = 0,
    val coins: Int = 0,
    val dailyStreak: Int = 0,
    val lastActiveDate: LocalDate? = null,
    val tasksCompletedToday: Int = 0,
    val dailyBonusClaimed: Boolean = false,
)
