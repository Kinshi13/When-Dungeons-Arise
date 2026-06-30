package com.guildadeaventureiros.app.data.repository

import com.guildadeaventureiros.app.data.db.dao.GameProfileDao
import com.guildadeaventureiros.app.data.db.entity.GameProfileEntity
import com.guildadeaventureiros.app.domain.model.GameProfile
import com.guildadeaventureiros.app.domain.reward.GameRewardService
import com.guildadeaventureiros.app.domain.reward.RewardEvent
import com.guildadeaventureiros.app.domain.reward.RewardResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.time.LocalDate

class GameProfileRepository(private val dao: GameProfileDao) {

    fun observeProfile(): Flow<GameProfile> = dao.observe().map { it?.toDomain() ?: GameProfile() }

    suspend fun currentProfile(): GameProfile = dao.get()?.toDomain() ?: GameProfile()

    suspend fun grantReward(event: RewardEvent, today: LocalDate = LocalDate.now()): RewardResult {
        val (updated, result) = GameRewardService.apply(currentProfile(), event, today)
        dao.upsert(updated.toEntity())
        return result
    }
}

private fun GameProfileEntity.toDomain() = GameProfile(
    level = level,
    xp = xp,
    coins = coins,
    dailyStreak = dailyStreak,
    lastActiveDate = lastActiveDateEpochDay?.let { LocalDate.ofEpochDay(it) },
    tasksCompletedToday = tasksCompletedToday,
    dailyBonusClaimed = dailyBonusClaimed,
)

private fun GameProfile.toEntity() = GameProfileEntity(
    level = level,
    xp = xp,
    coins = coins,
    dailyStreak = dailyStreak,
    lastActiveDateEpochDay = lastActiveDate?.toEpochDay(),
    tasksCompletedToday = tasksCompletedToday,
    dailyBonusClaimed = dailyBonusClaimed,
)
