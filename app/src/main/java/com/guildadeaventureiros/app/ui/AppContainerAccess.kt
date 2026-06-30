package com.guildadeaventureiros.app.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import com.guildadeaventureiros.app.GuildaApplication
import com.guildadeaventureiros.app.data.AppContainer

@Composable
fun rememberAppContainer(): AppContainer {
    val context = LocalContext.current
    return (context.applicationContext as GuildaApplication).container
}
