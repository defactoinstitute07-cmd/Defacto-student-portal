package com.student.erp

import android.content.Context
import androidx.security.crypto.EncryptedFile
import androidx.security.crypto.MasterKey
import org.json.JSONObject
import java.io.File

class SecureTokenStore(context: Context) {
    private val appContext = context.applicationContext
    private val tokenFile = File(appContext.filesDir, "secure/auth_state.json.enc")

    // The AES key is generated inside Android Keystore, so the app only ever writes ciphertext to disk.
    private val masterKey by lazy {
        MasterKey.Builder(appContext)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
    }

    fun read(): AuthState? {
        if (!tokenFile.exists()) {
            return null
        }

        return try {
            encryptedFile().openFileInput().bufferedReader(Charsets.UTF_8).use { reader ->
                AuthState.fromJson(JSONObject(reader.readText()))
            }
        } catch (_: Exception) {
            clear()
            null
        }
    }

    fun write(state: AuthState) {
        tokenFile.parentFile?.mkdirs()
        if (tokenFile.exists()) {
            tokenFile.delete()
        }

        encryptedFile().openFileOutput().bufferedWriter(Charsets.UTF_8).use { writer ->
            writer.write(state.toJson().toString())
        }
    }

    fun clear() {
        if (tokenFile.exists()) {
            tokenFile.delete()
        }
    }

    private fun encryptedFile(): EncryptedFile = EncryptedFile.Builder(
        appContext,
        tokenFile,
        masterKey,
        EncryptedFile.FileEncryptionScheme.AES256_GCM_HKDF_4KB
    ).build()
}
