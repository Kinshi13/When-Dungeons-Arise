package com.guildadeaventureiros.app.ui.treasury

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.guildadeaventureiros.app.data.repository.GameProfileRepository
import com.guildadeaventureiros.app.data.repository.TreasuryRepository
import com.guildadeaventureiros.app.domain.model.Bill
import com.guildadeaventureiros.app.domain.model.Expense
import com.guildadeaventureiros.app.domain.model.GameProfile
import com.guildadeaventureiros.app.domain.model.Receivable
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate

class TreasuryViewModel(
    private val treasuryRepository: TreasuryRepository,
    gameProfileRepository: GameProfileRepository,
) : ViewModel() {

    val profile: StateFlow<GameProfile> = gameProfileRepository.observeProfile()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), GameProfile())

    val expenses: StateFlow<List<Expense>> = treasuryRepository.observeExpenses()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val bills: StateFlow<List<Bill>> = treasuryRepository.observeBills()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val receivables: StateFlow<List<Receivable>> = treasuryRepository.observeReceivables()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun logExpense(amountCents: Long, description: String) {
        viewModelScope.launch { treasuryRepository.logExpense(amountCents, description, LocalDate.now()) }
    }

    fun addBill(description: String, amountCents: Long, dueDate: LocalDate) {
        viewModelScope.launch { treasuryRepository.addBill(description, amountCents, dueDate) }
    }

    fun payBill(billId: Long) {
        viewModelScope.launch { treasuryRepository.payBill(billId) }
    }

    fun addReceivable(description: String, amountCents: Long, expectedDate: LocalDate) {
        viewModelScope.launch { treasuryRepository.addReceivable(description, amountCents, expectedDate) }
    }

    fun markReceived(receivableId: Long) {
        viewModelScope.launch { treasuryRepository.markReceived(receivableId) }
    }
}

class TreasuryViewModelFactory(
    private val treasuryRepository: TreasuryRepository,
    private val gameProfileRepository: GameProfileRepository,
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return TreasuryViewModel(treasuryRepository, gameProfileRepository) as T
    }
}
