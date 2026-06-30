package com.guildadeaventureiros.app.ui.reader

import android.graphics.Bitmap
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import java.io.File

/** Abre um PDF local e renderiza páginas individuais como bitmaps ajustados à largura da tela. */
class PdfPageRenderer(file: File) : AutoCloseable {
    private val fileDescriptor = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
    private val renderer = PdfRenderer(fileDescriptor)

    val pageCount: Int get() = renderer.pageCount

    fun renderPage(index: Int, targetWidthPx: Int): Bitmap {
        renderer.openPage(index).use { page ->
            val scale = targetWidthPx.toFloat() / page.width
            val targetHeightPx = (page.height * scale).toInt().coerceAtLeast(1)
            val bitmap = Bitmap.createBitmap(targetWidthPx, targetHeightPx, Bitmap.Config.ARGB_8888)
            page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
            return bitmap
        }
    }

    override fun close() {
        renderer.close()
        fileDescriptor.close()
    }
}
