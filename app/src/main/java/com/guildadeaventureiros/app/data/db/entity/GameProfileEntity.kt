package com.guildadeaventureiros.app.data.db.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/** Linha única (id fixo 0) — o app tem um único perfil de jogador local. */
@Entity(tableName = "game_profile")
data class GameProfileEntity(
    @PrimaryKey val id: Int = 0,
    val level: Int,
    val xp: Int,
    val coins: Int,
    val dailyStreak: Int,
    val lastActiveDateEpochDay: Long?,
    val tasksCompletedToday: Int,
    val dailyBonusClaimed: Boolean,
)
