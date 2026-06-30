package com.guildadeaventureiros.app.domain

import com.guildadeaventureiros.app.domain.model.GameProfile
import com.guildadeaventureiros.app.domain.model.MissionDifficulty
import com.guildadeaventureiros.app.domain.reward.GameRewardService
import com.guildadeaventureiros.app.domain.reward.RewardEvent
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate

class GameRewardServiceTest {

    private val today = LocalDate.of(2026, 6, 30)

    @Test
    fun `simple mission grants 10xp and 10 coins`() {
        val (profile, result) = GameRewardService.apply(
            GameProfile(), RewardEvent.MissionCompleted(MissionDifficulty.SIMPLE, onTime = true), today
        )
        assertEquals(10, result.delta.xp)
        assertEquals(10, result.delta.coins)
        assertEquals(10, profile.xp)
        assertEquals(10, profile.coins)
    }

    @Test
    fun `medium mission grants 25xp and 25 coins`() {
        val (_, result) = GameRewardService.apply(
            GameProfile(), RewardEvent.MissionCompleted(MissionDifficulty.MEDIUM, onTime = true), today
        )
        assertEquals(25, result.delta.xp)
        assertEquals(25, result.delta.coins)
    }

    @Test
    fun `important mission grants 50xp and 50 coins`() {
        val (_, result) = GameRewardService.apply(
            GameProfile(), RewardEvent.MissionCompleted(MissionDifficulty.IMPORTANT, onTime = true), today
        )
        assertEquals(50, result.delta.xp)
        assertEquals(50, result.delta.coins)
    }

    @Test
    fun `completing 3 on-time missions in a day grants 50xp bonus once`() {
        var profile = GameProfile()
        repeat(2) {
            val (p, _) = GameRewardService.apply(
                profile, RewardEvent.MissionCompleted(MissionDifficulty.SIMPLE, onTime = true), today
            )
            profile = p
        }
        assertFalse(profile.dailyBonusClaimed)

        val (afterThird, thirdResult) = GameRewardService.apply(
            profile, RewardEvent.MissionCompleted(MissionDifficulty.SIMPLE, onTime = true), today
        )
        // 10 (base) + 50 (bonus) = 60
        assertEquals(60, thirdResult.delta.xp)
        assertTrue(afterThird.dailyBonusClaimed)

        // a 4th mission the same day must not grant the bonus again
        val (_, fourthResult) = GameRewardService.apply(
            afterThird, RewardEvent.MissionCompleted(MissionDifficulty.SIMPLE, onTime = true), today
        )
        assertEquals(10, fourthResult.delta.xp)
    }

    @Test
    fun `late mission still grants full reward but does not count toward daily bonus`() {
        var profile = GameProfile()
        repeat(3) {
            val (p, _) = GameRewardService.apply(
                profile, RewardEvent.MissionCompleted(MissionDifficulty.IMPORTANT, onTime = false), today
            )
            profile = p
        }
        // 3 x 50xp = 150, no bonus ever claimed because none were on-time
        assertEquals(150, profile.xp)
        assertFalse(profile.dailyBonusClaimed)
        assertEquals(0, profile.tasksCompletedToday)
    }

    @Test
    fun `reading 20 minutes grants 30xp and 20 coins`() {
        val (_, result) = GameRewardService.apply(GameProfile(), RewardEvent.ReadingSession(20), today)
        assertEquals(30, result.delta.xp)
        assertEquals(20, result.delta.coins)
    }

    @Test
    fun `logging an expense grants 10xp only`() {
        val (_, result) = GameRewardService.apply(GameProfile(), RewardEvent.ExpenseLogged, today)
        assertEquals(10, result.delta.xp)
        assertEquals(0, result.delta.coins)
    }

    @Test
    fun `paying a bill grants 20xp and 15 coins`() {
        val (_, result) = GameRewardService.apply(GameProfile(), RewardEvent.BillPaid, today)
        assertEquals(20, result.delta.xp)
        assertEquals(15, result.delta.coins)
    }

    @Test
    fun `leveling up is detected when crossing the xp threshold`() {
        val nearLevelUp = GameProfile(xp = 145, level = 1)
        val (profile, result) = GameRewardService.apply(
            nearLevelUp, RewardEvent.MissionCompleted(MissionDifficulty.SIMPLE, onTime = true), today
        )
        assertTrue(result.leveledUp)
        assertEquals(2, profile.level)
    }

    @Test
    fun `streak increments on consecutive active days and resets after a gap`() {
        val (afterDay1, _) = GameRewardService.apply(
            GameProfile(), RewardEvent.MissionCompleted(MissionDifficulty.SIMPLE, onTime = true), today
        )
        val (afterDay2, _) = GameRewardService.apply(
            afterDay1, RewardEvent.MissionCompleted(MissionDifficulty.SIMPLE, onTime = true), today.plusDays(1)
        )
        assertEquals(1, afterDay2.dailyStreak)

        // skip a day entirely -> streak resets, but no further xp punishment
        val (afterGap, _) = GameRewardService.apply(
            afterDay2, RewardEvent.MissionCompleted(MissionDifficulty.SIMPLE, onTime = true), today.plusDays(3)
        )
        assertEquals(0, afterGap.dailyStreak)
    }
}
