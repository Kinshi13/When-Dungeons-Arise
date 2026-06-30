package com.guildadeaventureiros.app.data

import android.content.Context
import com.guildadeaventureiros.app.data.db.AppDatabase
import com.guildadeaventureiros.app.data.repository.GameProfileRepository
import com.guildadeaventureiros.app.data.repository.LibraryRepository
import com.guildadeaventureiros.app.data.repository.MissionRepository
import com.guildadeaventureiros.app.data.repository.SettingsRepository
import com.guildadeaventureiros.app.data.repository.TreasuryRepository

/** Service locator simples — sem framework de DI, suficiente para o tamanho do MVP. */
class AppContainer(context: Context) {
    private val db = AppDatabase.get(context)

    val gameProfileRepository = GameProfileRepository(db.gameProfileDao())
    val missionRepository = MissionRepository(db.missionDao(), gameProfileRepository)
    val treasuryRepository = TreasuryRepository(db.financeDao(), gameProfileRepository)
    val libraryRepository = LibraryRepository(db.libraryDao(), gameProfileRepository)
    val settingsRepository = SettingsRepository(context)
}
