package com.guildadeaventureiros.app.ui

import android.graphics.Bitmap
import android.graphics.Canvas
import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.guildadeaventureiros.app.ui.components.CharacterPortraitBar
import com.guildadeaventureiros.app.ui.components.MuralPopup
import com.guildadeaventureiros.app.ui.reception.GuildReceptionScreen
import com.guildadeaventureiros.app.ui.theme.GuildaTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File
import java.io.FileOutputStream

/**
 * Testes de captura de tela via Robolectric (renderização real do Compose, sem emulador).
 * Usados apenas para diagnóstico visual local — não fazem parte da suíte de regressão.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [34], qualifiers = "w411dp-h914dp-xhdpi")
class ScreenshotTest {

    @get:Rule
    val composeRule = createAndroidComposeRule<ComponentActivity>()

    private fun save(name: String) {
        val decorView = composeRule.activity.window.decorView
        decorView.measure(
            android.view.View.MeasureSpec.makeMeasureSpec(decorView.width, android.view.View.MeasureSpec.EXACTLY),
            android.view.View.MeasureSpec.makeMeasureSpec(decorView.height, android.view.View.MeasureSpec.EXACTLY),
        )
        decorView.layout(0, 0, decorView.width, decorView.height)
        val bitmap = Bitmap.createBitmap(decorView.width, decorView.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        decorView.draw(canvas)
        val outDir = File(System.getProperty("guilda.screenshotDir") ?: "build/screenshots")
        outDir.mkdirs()
        FileOutputStream(File(outDir, name)).use { out ->
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
        }
    }

    @Test
    fun receptionScreen() {
        composeRule.setContent {
            GuildaTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    GuildReceptionScreen(onOpenMissionBoard = {}, onOpenSettings = {})
                }
            }
        }
        composeRule.waitForIdle()
        save("device_reception_screen.png")
    }

    @Test
    fun muralPopup() {
        composeRule.setContent {
            GuildaTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    MuralPopup(visible = true, onDismiss = {}, onOpenTasks = {}, onOpenSettings = {})
                }
            }
        }
        composeRule.waitForIdle()
        save("device_mural_popup.png")
    }

    @Test
    fun portraitBar() {
        composeRule.setContent {
            GuildaTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    CharacterPortraitBar(currentPage = 0, onSelectPage = {})
                }
            }
        }
        composeRule.waitForIdle()
        save("device_portrait_bar.png")
    }

    @Test
    fun areasPagerLayout() {
        composeRule.setContent {
            GuildaTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    Column(modifier = Modifier.fillMaxSize()) {
                        Box(modifier = Modifier.weight(1f)) {
                            GuildReceptionScreen(onOpenMissionBoard = {}, onOpenSettings = {})
                        }
                        CharacterPortraitBar(currentPage = 0, onSelectPage = {})
                    }
                }
            }
        }
        composeRule.waitForIdle()
        save("device_areas_pager_layout.png")
    }
}
