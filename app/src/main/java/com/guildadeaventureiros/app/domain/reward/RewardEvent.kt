package com.guildadeaventureiros.app.domain.reward

import com.guildadeaventureiros.app.domain.model.MissionDifficulty

sealed class RewardEvent {
    data class MissionCompleted(val difficulty: MissionDifficulty, val onTime: Boolean) : RewardEvent()
    data class ReadingSession(val minutes: Int) : RewardEvent()
    data object ExpenseLogged : RewardEvent()
    data object BillPaid : RewardEvent()
    data object DailyTaskBonus : RewardEvent()
}

data class RewardDelta(val xp: Int, val coins: Int) {
    operator fun plus(other: RewardDelta) = RewardDelta(xp + other.xp, coins + other.coins)
}

data class RewardResult(
    val delta: RewardDelta,
    val newLevel: Int,
    val leveledUp: Boolean,
)
