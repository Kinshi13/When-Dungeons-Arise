package com.guildadeaventureiros.app.domain.reward

import com.guildadeaventureiros.app.domain.leveling.LevelTable
import com.guildadeaventureiros.app.domain.model.GameProfile
import com.guildadeaventureiros.app.domain.model.MissionDifficulty
import java.time.LocalDate

/**
 * Calcula e aplica recompensas de XP/moedas sobre um [GameProfile].
 *
 * Regra de tarefas atrasadas: uma missão concluída atrasada (onTime = false) ainda
 * recebe o XP/moedas cheios da dificuldade dela — a única diferença é que ela não
 * conta para o bônus de "3 missões no dia". Não punir, só remover o bônus.
 */
object GameRewardService {

    private fun baseDelta(event: RewardEvent): RewardDelta = when (event) {
        is RewardEvent.MissionCompleted -> when (event.difficulty) {
            MissionDifficulty.SIMPLE -> RewardDelta(xp = 10, coins = 10)
            MissionDifficulty.MEDIUM -> RewardDelta(xp = 25, coins = 25)
            MissionDifficulty.IMPORTANT -> RewardDelta(xp = 50, coins = 50)
        }
        is RewardEvent.ReadingSession -> {
            val blocks = event.minutes / 20
            RewardDelta(xp = 30 * blocks, coins = 20 * blocks)
        }
        RewardEvent.ExpenseLogged -> RewardDelta(xp = 10, coins = 0)
        RewardEvent.BillPaid -> RewardDelta(xp = 20, coins = 15)
        RewardEvent.DailyTaskBonus -> RewardDelta(xp = 50, coins = 0)
    }

    fun apply(profile: GameProfile, event: RewardEvent, today: LocalDate = LocalDate.now()): Pair<GameProfile, RewardResult> {
        val working = rolloverDayIfNeeded(profile, today)

        val delta = baseDelta(event)
        var tasksCompletedToday = working.tasksCompletedToday
        var dailyBonusClaimed = working.dailyBonusClaimed
        var bonusDelta = RewardDelta(0, 0)

        if (event is RewardEvent.MissionCompleted && event.onTime) {
            tasksCompletedToday += 1
            if (tasksCompletedToday >= 3 && !dailyBonusClaimed) {
                bonusDelta = baseDelta(RewardEvent.DailyTaskBonus)
                dailyBonusClaimed = true
            }
        }

        val combinedDelta = delta + bonusDelta
        val totalXp = working.xp + combinedDelta.xp
        val totalCoins = working.coins + combinedDelta.coins

        val previousLevel = LevelTable.levelForXp(working.xp)
        val newLevel = LevelTable.levelForXp(totalXp)

        val updatedProfile = working.copy(
            xp = totalXp,
            coins = totalCoins,
            level = newLevel,
            tasksCompletedToday = tasksCompletedToday,
            dailyBonusClaimed = dailyBonusClaimed,
            lastActiveDate = today,
        )

        val result = RewardResult(
            delta = combinedDelta,
            newLevel = newLevel,
            leveledUp = newLevel > previousLevel,
        )
        return updatedProfile to result
    }

    /**
     * Vira o dia: a sequência (streak) avança se houve pelo menos uma missão concluída
     * no dia anterior, ou zera se ficou um dia em branco. Contadores diários de bônus
     * são reiniciados. Isso não é punição de tarefa atrasada — é só a virada normal do dia.
     */
    private fun rolloverDayIfNeeded(profile: GameProfile, today: LocalDate): GameProfile {
        val last = profile.lastActiveDate ?: return profile.copy(lastActiveDate = today)
        if (last == today) return profile

        val streak = when {
            last == today.minusDays(1) && profile.tasksCompletedToday > 0 -> profile.dailyStreak + 1
            last == today.minusDays(1) -> profile.dailyStreak
            else -> 0
        }

        return profile.copy(
            dailyStreak = streak,
            tasksCompletedToday = 0,
            dailyBonusClaimed = false,
        )
    }
}
