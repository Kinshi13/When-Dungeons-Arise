package com.guildadeaventureiros.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val GuildDarkScheme = darkColorScheme(
    primary = GuildColors.Gold,
    onPrimary = GuildColors.WoodDark,
    secondary = GuildColors.Purple,
    onSecondary = GuildColors.TextOnDark,
    background = GuildColors.WoodDark,
    onBackground = GuildColors.TextOnDark,
    surface = GuildColors.WoodMid,
    onSurface = GuildColors.TextOnDark,
)

@Composable
fun GuildaTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = GuildDarkScheme,
        typography = GuildTypography,
        content = content
    )
}
