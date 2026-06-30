package com.guildadeaventureiros.app.domain.leveling

/** XP fixo de 150 por nível no MVP — ajustável aqui sem tocar no resto do app. */
object LevelTable {
    private const val XP_PER_LEVEL = 150

    fun levelForXp(totalXp: Int): Int = (totalXp / XP_PER_LEVEL) + 1

    fun xpIntoCurrentLevel(totalXp: Int): Int = totalXp % XP_PER_LEVEL

    fun xpForNextLevel(): Int = XP_PER_LEVEL
}
