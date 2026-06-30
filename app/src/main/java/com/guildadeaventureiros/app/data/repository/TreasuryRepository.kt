package com.guildadeaventureiros.app.data.repository

import com.guildadeaventureiros.app.data.db.dao.FinanceDao
import com.guildadeaventureiros.app.data.db.entity.BillEntity
import com.guildadeaventureiros.app.data.db.entity.ExpenseEntity
import com.guildadeaventureiros.app.data.db.entity.ReceivableEntity
import com.guildadeaventureiros.app.domain.model.Bill
import com.guildadeaventureiros.app.domain.model.Expense
import com.guildadeaventureiros.app.domain.model.Receivable
import com.guildadeaventureiros.app.domain.reward.RewardEvent
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.time.Instant
import java.time.LocalDate

class TreasuryRepository(
    private val financeDao: FinanceDao,
    private val gameProfileRepository: GameProfileRepository,
) {
    fun observeExpenses(): Flow<List<Expense>> = financeDao.observeExpenses().map { list -> list.map { it.toDomain() } }
    fun observeBills(): Flow<List<Bill>> = financeDao.observeBills().map { list -> list.map { it.toDomain() } }
    fun observeReceivables(): Flow<List<Receivable>> = financeDao.observeReceivables().map { list -> list.map { it.toDomain() } }

    suspend fun logExpense(amountCents: Long, description: String, date: LocalDate = LocalDate.now()) {
        financeDao.insertExpense(
            ExpenseEntity(amountCents = amountCents, description = description, dateEpochDay = date.toEpochDay())
        )
        gameProfileRepository.grantReward(RewardEvent.ExpenseLogged)
    }

    suspend fun addBill(description: String, amountCents: Long, dueDate: LocalDate) {
        financeDao.insertBill(
            BillEntity(
                description = description,
                amountCents = amountCents,
                dueDateEpochDay = dueDate.toEpochDay(),
                paid = false,
                paidAtEpochMilli = null,
            )
        )
    }

    suspend fun payBill(billId: Long) {
        val bill = financeDao.findBillById(billId) ?: return
        financeDao.updateBill(bill.copy(paid = true, paidAtEpochMilli = Instant.now().toEpochMilli()))
        gameProfileRepository.grantReward(RewardEvent.BillPaid)
    }

    suspend fun addReceivable(description: String, amountCents: Long, expectedDate: LocalDate) {
        financeDao.insertReceivable(
            ReceivableEntity(
                description = description,
                amountCents = amountCents,
                expectedDateEpochDay = expectedDate.toEpochDay(),
                received = false,
            )
        )
    }

    suspend fun markReceived(receivableId: Long) {
        val receivable = financeDao.findReceivableById(receivableId) ?: return
        financeDao.updateReceivable(receivable.copy(received = true))
    }
}

private fun ExpenseEntity.toDomain() = Expense(id = id, amountCents = amountCents, description = description, date = LocalDate.ofEpochDay(dateEpochDay))
private fun BillEntity.toDomain() = Bill(id = id, description = description, amountCents = amountCents, dueDate = LocalDate.ofEpochDay(dueDateEpochDay), paid = paid, paidAt = paidAtEpochMilli?.let { Instant.ofEpochMilli(it) })
private fun ReceivableEntity.toDomain() = Receivable(id = id, description = description, amountCents = amountCents, expectedDate = LocalDate.ofEpochDay(expectedDateEpochDay), received = received)
