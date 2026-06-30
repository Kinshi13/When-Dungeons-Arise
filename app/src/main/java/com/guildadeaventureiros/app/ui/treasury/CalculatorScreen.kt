package com.guildadeaventureiros.app.ui.treasury

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.guildadeaventureiros.app.ui.components.PixelButton
import com.guildadeaventureiros.app.ui.theme.GuildColors

private enum class Operator { ADD, SUBTRACT, MULTIPLY, DIVIDE }

/** Calculadora simples para apoiar contas da tesouraria. */
@Composable
fun CalculatorScreen(
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var display by remember { mutableStateOf("0") }
    var pendingValue by remember { mutableStateOf<Double?>(null) }
    var pendingOperator by remember { mutableStateOf<Operator?>(null) }
    var startNewEntry by remember { mutableStateOf(false) }

    fun inputDigit(digit: String) {
        display = when {
            startNewEntry -> digit.also { startNewEntry = false }
            display == "0" -> digit
            else -> display + digit
        }
    }

    fun inputDot() {
        if (startNewEntry) {
            display = "0."
            startNewEntry = false
        } else if (!display.contains(".")) {
            display += "."
        }
    }

    fun applyPending() {
        val current = display.toDoubleOrNull() ?: 0.0
        val result = when (pendingOperator) {
            Operator.ADD -> (pendingValue ?: 0.0) + current
            Operator.SUBTRACT -> (pendingValue ?: 0.0) - current
            Operator.MULTIPLY -> (pendingValue ?: 0.0) * current
            Operator.DIVIDE -> if (current != 0.0) (pendingValue ?: 0.0) / current else current
            null -> current
        }
        display = formatResult(result)
        pendingValue = result
    }

    fun chooseOperator(operator: Operator) {
        if (pendingOperator != null && !startNewEntry) {
            applyPending()
        } else {
            pendingValue = display.toDoubleOrNull() ?: 0.0
        }
        pendingOperator = operator
        startNewEntry = true
    }

    fun clear() {
        display = "0"
        pendingValue = null
        pendingOperator = null
        startNewEntry = false
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(text = "Calculadora")
            PixelButton(text = "Voltar", onClick = onBack)
        }

        Text(
            text = display,
            color = GuildColors.Gold,
            textAlign = TextAlign.End,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 24.dp),
        )

        val rows = listOf(
            listOf("7", "8", "9", "÷"),
            listOf("4", "5", "6", "×"),
            listOf("1", "2", "3", "−"),
            listOf("C", "0", ".", "+"),
        )

        rows.forEach { row ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                row.forEach { label ->
                    PixelButton(
                        text = label,
                        onClick = {
                            when (label) {
                                "C" -> clear()
                                "." -> inputDot()
                                "+" -> chooseOperator(Operator.ADD)
                                "−" -> chooseOperator(Operator.SUBTRACT)
                                "×" -> chooseOperator(Operator.MULTIPLY)
                                "÷" -> chooseOperator(Operator.DIVIDE)
                                else -> inputDigit(label)
                            }
                        },
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }

        PixelButton(
            text = "=",
            onClick = { applyPending(); pendingOperator = null; startNewEntry = true },
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 4.dp),
        )
    }
}

private fun formatResult(value: Double): String {
    return if (value == value.toLong().toDouble()) value.toLong().toString() else value.toString()
}
