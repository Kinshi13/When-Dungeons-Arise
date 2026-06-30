package com.guildadeaventureiros.app.ui.treasury

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.guildadeaventureiros.app.R
import com.guildadeaventureiros.app.ui.components.GameTopBar
import com.guildadeaventureiros.app.ui.components.PixelButton
import com.guildadeaventureiros.app.ui.components.SceneBackground
import com.guildadeaventureiros.app.ui.rememberAppContainer
import java.time.LocalDate

/** Tesouraria — registro de gastos diários, contas a pagar e valores a receber. */
@Composable
fun TreasuryScreen(
    onOpenCalculator: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val container = rememberAppContainer()
    val viewModel: TreasuryViewModel = viewModel(
        factory = TreasuryViewModelFactory(container.treasuryRepository, container.gameProfileRepository),
    )
    val profile by viewModel.profile.collectAsState()
    val expenses by viewModel.expenses.collectAsState()
    val bills by viewModel.bills.collectAsState()
    val receivables by viewModel.receivables.collectAsState()

    val today = remember { LocalDate.now() }
    val spentToday = expenses.filter { it.date == today }.sumOf { it.amountCents }

    var expenseDescription by remember { mutableStateOf("") }
    var expenseAmount by remember { mutableStateOf("") }
    var billDescription by remember { mutableStateOf("") }
    var billAmount by remember { mutableStateOf("") }
    var receivableDescription by remember { mutableStateOf("") }
    var receivableAmount by remember { mutableStateOf("") }

    SceneBackground(backgroundRes = R.drawable.bg_treasury, modifier = modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            GameTopBar(profile = profile)
            Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(text = "Gasto hoje: ${formatCents(spentToday)}")
                    PixelButton(text = "Calculadora", onClick = onOpenCalculator)
                }

                Column(modifier = Modifier.padding(vertical = 12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = expenseDescription,
                        onValueChange = { expenseDescription = it },
                        label = { Text("Descrição do gasto") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    OutlinedTextField(
                        value = expenseAmount,
                        onValueChange = { expenseAmount = it },
                        label = { Text("Valor (R$)") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    PixelButton(
                        text = "Registrar gasto",
                        enabled = expenseDescription.isNotBlank() && parseCentsOrNull(expenseAmount) != null,
                        onClick = {
                            val cents = parseCentsOrNull(expenseAmount) ?: return@PixelButton
                            viewModel.logExpense(cents, expenseDescription.trim())
                            expenseDescription = ""
                            expenseAmount = ""
                        },
                        modifier = Modifier.fillMaxWidth(),
                    )
                }

                HorizontalDivider()
                Text(text = "Contas a pagar", modifier = Modifier.padding(top = 8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(vertical = 4.dp)) {
                    OutlinedTextField(
                        value = billDescription,
                        onValueChange = { billDescription = it },
                        label = { Text("Conta") },
                        modifier = Modifier.weight(1f),
                    )
                    OutlinedTextField(
                        value = billAmount,
                        onValueChange = { billAmount = it },
                        label = { Text("R$") },
                        modifier = Modifier.weight(1f),
                    )
                }
                PixelButton(
                    text = "Adicionar conta",
                    enabled = billDescription.isNotBlank() && parseCentsOrNull(billAmount) != null,
                    onClick = {
                        val cents = parseCentsOrNull(billAmount) ?: return@PixelButton
                        viewModel.addBill(billDescription.trim(), cents, today.plusDays(7))
                        billDescription = ""
                        billAmount = ""
                    },
                    modifier = Modifier.fillMaxWidth(),
                )
                LazyColumn(modifier = Modifier.weight(1f, fill = false)) {
                    items(bills.filter { !it.paid }, key = { it.id }) { bill ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text(text = "${bill.description} — ${formatCents(bill.amountCents)}")
                            PixelButton(text = "Pagar", onClick = { viewModel.payBill(bill.id) })
                        }
                    }
                }

                HorizontalDivider()
                Text(text = "A receber", modifier = Modifier.padding(top = 8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(vertical = 4.dp)) {
                    OutlinedTextField(
                        value = receivableDescription,
                        onValueChange = { receivableDescription = it },
                        label = { Text("A receber") },
                        modifier = Modifier.weight(1f),
                    )
                    OutlinedTextField(
                        value = receivableAmount,
                        onValueChange = { receivableAmount = it },
                        label = { Text("R$") },
                        modifier = Modifier.weight(1f),
                    )
                }
                PixelButton(
                    text = "Adicionar a receber",
                    enabled = receivableDescription.isNotBlank() && parseCentsOrNull(receivableAmount) != null,
                    onClick = {
                        val cents = parseCentsOrNull(receivableAmount) ?: return@PixelButton
                        viewModel.addReceivable(receivableDescription.trim(), cents, today.plusDays(7))
                        receivableDescription = ""
                        receivableAmount = ""
                    },
                    modifier = Modifier.fillMaxWidth(),
                )
                LazyColumn(modifier = Modifier.weight(1f, fill = false)) {
                    items(receivables.filter { !it.received }, key = { it.id }) { receivable ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text(text = "${receivable.description} — ${formatCents(receivable.amountCents)}")
                            PixelButton(text = "Recebido", onClick = { viewModel.markReceived(receivable.id) })
                        }
                    }
                }
            }
        }
    }
}
