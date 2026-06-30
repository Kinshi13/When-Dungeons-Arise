package com.guildadeaventureiros.app.data.db.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.guildadeaventureiros.app.data.db.entity.BillEntity
import com.guildadeaventureiros.app.data.db.entity.ExpenseEntity
import com.guildadeaventureiros.app.data.db.entity.ReceivableEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface FinanceDao {
    @Query("SELECT * FROM expenses ORDER BY dateEpochDay DESC")
    fun observeExpenses(): Flow<List<ExpenseEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExpense(expense: ExpenseEntity): Long

    @Delete
    suspend fun deleteExpense(expense: ExpenseEntity)

    @Query("SELECT * FROM bills ORDER BY dueDateEpochDay ASC")
    fun observeBills(): Flow<List<BillEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBill(bill: BillEntity): Long

    @Update
    suspend fun updateBill(bill: BillEntity)

    @Query("SELECT * FROM bills WHERE id = :id")
    suspend fun findBillById(id: Long): BillEntity?

    @Query("SELECT * FROM receivables ORDER BY expectedDateEpochDay ASC")
    fun observeReceivables(): Flow<List<ReceivableEntity>>

    @Query("SELECT * FROM receivables WHERE id = :id")
    suspend fun findReceivableById(id: Long): ReceivableEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReceivable(receivable: ReceivableEntity): Long

    @Update
    suspend fun updateReceivable(receivable: ReceivableEntity)
}
