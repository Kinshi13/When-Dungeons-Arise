package com.guildadeaventureiros.app.ui.reader

import java.io.File
import java.util.zip.ZipFile

/**
 * Extrator simples de EPUB: lê o spine do .opf (quando presente) para ordenar os capítulos
 * e devolve o texto puro de cada XHTML, sem preservar formatação rica — suficiente para o MVP.
 */
object EpubParser {

    fun extractChapters(file: File): List<String> {
        ZipFile(file).use { zip ->
            val opfPath = findOpfPath(zip)
            val entryNames = if (opfPath != null) {
                orderedSpineHrefs(zip, opfPath)
            } else {
                zip.entries().asSequence()
                    .map { it.name }
                    .filter { it.endsWith(".xhtml") || it.endsWith(".html") || it.endsWith(".htm") }
                    .sorted()
                    .toList()
            }

            return entryNames.mapNotNull { name ->
                zip.getEntry(name)?.let { entry ->
                    val raw = zip.getInputStream(entry).bufferedReader().use { it.readText() }
                    htmlToPlainText(raw)
                }
            }.filter { it.isNotBlank() }
        }
    }

    private fun findOpfPath(zip: ZipFile): String? {
        val container = zip.getEntry("META-INF/container.xml") ?: return null
        val xml = zip.getInputStream(container).bufferedReader().use { it.readText() }
        return Regex("full-path=\"([^\"]+)\"").find(xml)?.groupValues?.get(1)
    }

    private fun orderedSpineHrefs(zip: ZipFile, opfPath: String): List<String> {
        val opfEntry = zip.getEntry(opfPath) ?: return emptyList()
        val opfXml = zip.getInputStream(opfEntry).bufferedReader().use { it.readText() }
        val basePath = opfPath.substringBeforeLast("/", "")

        val manifest = Regex("<item[^>]*id=\"([^\"]+)\"[^>]*href=\"([^\"]+)\"[^>]*/?>")
            .findAll(opfXml)
            .associate { it.groupValues[1] to it.groupValues[2] }
        val manifestAlt = Regex("<item[^>]*href=\"([^\"]+)\"[^>]*id=\"([^\"]+)\"[^>]*/?>")
            .findAll(opfXml)
            .associate { it.groupValues[2] to it.groupValues[1] }
        val combinedManifest = manifestAlt + manifest

        val spineIds = Regex("<itemref[^>]*idref=\"([^\"]+)\"").findAll(opfXml).map { it.groupValues[1] }.toList()

        return spineIds.mapNotNull { id -> combinedManifest[id] }
            .map { href -> if (basePath.isEmpty()) href else "$basePath/$href" }
    }

    private fun htmlToPlainText(html: String): String {
        val withoutScripts = Regex("(?is)<(script|style)[^>]*>.*?</\\1>").replace(html, "")
        val withBreaks = withoutScripts.replace(Regex("(?i)<(br|p|div|h[1-6])[^>]*>"), "\n")
        val withoutTags = withBreaks.replace(Regex("<[^>]+>"), "")
        return withoutTags
            .replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .lines()
            .joinToString("\n") { it.trim() }
            .replace(Regex("\n{3,}"), "\n\n")
            .trim()
    }
}
