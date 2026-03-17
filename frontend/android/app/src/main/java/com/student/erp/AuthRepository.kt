package com.student.erp

import android.content.Context
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.io.IOException

class AuthRepository(
    context: Context,
    private val api: AuthApi,
    private val secureTokenStore: SecureTokenStore
) {
    private val appContext = context.applicationContext
    private val refreshMutex = Mutex()

    suspend fun login(rollNo: String, password: String): AuthState {
        val session = api.login(rollNo, password, DevicePayload.fromContext(appContext))
        secureTokenStore.write(session)
        return session
    }

    fun loadCachedSession(): AuthState? = secureTokenStore.read()

    suspend fun ensureValidSession(
        validateWithServer: Boolean = false,
        forceRefresh: Boolean = false
    ): AuthState? = refreshMutex.withLock {
        val cached = secureTokenStore.read() ?: return@withLock null

        if (forceRefresh || JwtUtils.isExpired(cached.accessToken, 60L)) {
            return@withLock refreshOrInvalidate(cached)
        }

        if (!validateWithServer) {
            return@withLock cached
        }

        return@withLock try {
            val student = api.session(cached.accessToken)
            val updated = cached.copy(student = student)
            secureTokenStore.write(updated)
            updated
        } catch (error: ApiException) {
            if (error.statusCode == 401) {
                refreshOrInvalidate(cached)
            } else {
                cached
            }
        } catch (_: IOException) {
            cached
        }
    }

    suspend fun logout() {
        val cached = secureTokenStore.read()

        try {
            if (cached?.refreshToken?.isNotBlank() == true) {
                api.logout(cached.refreshToken)
            }
        } catch (_: Exception) {
            // Logout is best-effort server-side; local credentials are still wiped below.
        } finally {
            secureTokenStore.clear()
        }
    }

    suspend fun refreshOrInvalidate(cached: AuthState): AuthState? = try {
        val refreshed = api.refresh(cached.refreshToken, DevicePayload.fromContext(appContext))
        secureTokenStore.write(refreshed)
        refreshed
    } catch (error: ApiException) {
        if (error.statusCode == 401) {
            secureTokenStore.clear()
            null
        } else if (!JwtUtils.isExpired(cached.accessToken)) {
            cached
        } else {
            throw error
        }
    } catch (error: IOException) {
        if (!JwtUtils.isExpired(cached.accessToken)) {
            cached
        } else {
            throw error
        }
    }
}
