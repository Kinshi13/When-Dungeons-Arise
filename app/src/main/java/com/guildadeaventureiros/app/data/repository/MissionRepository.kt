package com.guildadeaventureiros.app.data.repository

import com.guildadeaventureiros.app.data.db.dao.MissionDao
import com.guildadeaventureiros.app.data.db.entity.MissionEntity
import com.guildadeaventureiros.app.domain.model.Mission
import com.guildadeaventureiros.app.domain.model.MissionDifficulty
import com.guildadeaventureiros.app.domain.model.MissionStatus
import com.guildadeaventureiros.app.domain.reward.RewardEvent
import com.guildadeaventureiros.app.domain.reward.RewardResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.time.Instant
import java.time.LocalDate

class MissionRepository(
    private val missionDao: MissionDao,
    private val gameProfileRepository: GameProfileRepository,
) {
    fun observeMissions(): Flow<List<Mission>> = missionDao.observeAll().map { list -> list.map { it.toDomain() } }

    suspend fun createMission(title: String, description: String?, difficulty: MissionDifficulty, dueDate: LocalDate?) {
        missionDao.upsert(
            MissionEntity(
                title = title,
                description = description,
                difficulty = difficulty.name,
                dueDateEpochDay = dueDate?.toEpochDay(),
                status = MissionStatus.PENDING.name,
                createdAtEpochMilli = Instant.now().toEpochMilli(),
                completedAtEpochMilli = null,
                completedLate = false,
            )
        )
    }

    suspend fun accept(missionId: Long) {
        val entity = missionDao.findById(missionId) ?: return
        missionDao.update(entity.copy(status = MissionStatus.ACCEPTED.name))
    }

    /**
     * Conclui a missão e concede a recompensa correspondente. Atraso (prazo já vencido)
     * não reduz XP/moedas — a missão só deixa de contar para o bônus de "3 no dia".
     */
    suspend fun complete(missionId: Long): RewardResult? {
        val entity = missionDao.findById(missionId) ?: return null
        val today = LocalDate.now()
        val dueDate = entity.dueDateEpochDay?.let { LocalDate.ofEpochDay(it) }
        val onTime = dueDate == null || !today.isAfter(dueDate)

        missionDao.update(
            entity.copy(
                status = MissionStatus.COMPLETED.name,
                completedAtEpochMilli = Instant.now().toEpochMilli(),
                completedLate = !onTime,
            )
        )

        val difficulty = MissionDifficulty.valueOf(entity.difficulty)
        return gameProfileRepository.grantReward(RewardEvent.MissionCompleted(difficulty, onTime), today)
    }

    suspend fun delete(missionId: Long) = missionDao.delete(missionId)
}

private fun MissionEntity.toDomain() = Mission(
    id = id,
    title = title,
    description = description,
    difficulty = MissionDifficulty.valueOf(difficulty),
    dueDate = dueDateEpochDay?.let { LocalDate.ofEpochDay(it) },
    status = MissionStatus.valueOf(status),
    createdAt = Instant.ofEpochMilli(createdAtEpochMilli),
    completedAt = completedAtEpochMilli?.let { Instant.ofEpochMilli(it) },
    completedLate = completedLate,
)
