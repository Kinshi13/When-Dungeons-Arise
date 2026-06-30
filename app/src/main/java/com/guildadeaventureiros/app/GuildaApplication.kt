package com.guildadeaventureiros.app

import android.app.Application
import com.guildadeaventureiros.app.data.AppContainer

class GuildaApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
