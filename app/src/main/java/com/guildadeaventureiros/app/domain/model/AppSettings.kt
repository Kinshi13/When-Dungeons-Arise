package com.guildadeaventureiros.app.domain.model

/** Preferências gerais do app — restauradas da tela de configurações original. */
data class AppSettings(
    val audioEnabled: Boolean = true,
    val notificationsEnabled: Boolean = true,
    val animationsEnabled: Boolean = true,
    val appDirectory: String = "GuildaDeAventureiros",
)
