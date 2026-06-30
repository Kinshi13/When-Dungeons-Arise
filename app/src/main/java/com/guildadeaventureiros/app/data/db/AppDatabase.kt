package com.guildadeaventureiros.app.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.guildadeaventureiros.app.data.db.dao.FinanceDao
import com.guildadeaventureiros.app.data.db.dao.GameProfileDao
import com.guildadeaventureiros.app.data.db.dao.LibraryDao
import com.guildadeaventureiros.app.data.db.dao.MissionDao
import com.guildadeaventureiros.app.data.db.entity.AnnotationEntity
import com.guildadeaventureiros.app.data.db.entity.BillEntity
import com.guildadeaventureiros.app.data.db.entity.ExpenseEntity
import com.guildadeaventureiros.app.data.db.entity.GameProfileEntity
import com.guildadeaventureiros.app.data.db.entity.LibraryItemEntity
import com.guildadeaventureiros.app.data.db.entity.MissionEntity
import com.guildadeaventureiros.app.data.db.entity.ReadingProgressEntity
import com.guildadeaventureiros.app.data.db.entity.ReceivableEntity

@Database(
    entities = [
        MissionEntity::class,
        GameProfileEntity::class,
        ExpenseEntity::class,
        BillEntity::class,
        ReceivableEntity::class,
        LibraryItemEntity::class,
        ReadingProgressEntity::class,
        AnnotationEntity::class,
    ],
    version = 1,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun missionDao(): MissionDao
    abstract fun gameProfileDao(): GameProfileDao
    abstract fun financeDao(): FinanceDao
    abstract fun libraryDao(): LibraryDao

    companion object {
        @Volatile private var instance: AppDatabase? = null

        fun get(context: Context): AppDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "guilda.db",
                ).build().also { instance = it }
            }
    }
}
