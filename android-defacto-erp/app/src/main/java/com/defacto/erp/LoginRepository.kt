package com.student.erp

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

data class LoginSuccess(
    val token: String,
    val refreshToken: String,
    val studentJson: String,
    val accessTokenExpiresAt: String?
)

data class LoginError(val message: String)

sealed class LoginResult {
    data class Success(val data: LoginSuccess) : LoginResult()
    data class Error(val error: LoginError) : LoginResult()
}

class LoginRepository {
    private val client = OkHttpClient()
    private val jsonType = "application/json; charset=utf-8".toMediaType()

    fun login(rollNo: String, password: String): LoginResult {
        val requestBody = JSONObject()
            .put("rollNo", rollNo.trim())
            .put("password", password)
            .toString()
            .toRequestBody(jsonType)

        val request = Request.Builder()
            .url(LOGIN_URL)
            .post(requestBody)
            .build()

        return try {
            client.newCall(request).execute().use { response ->
                val bodyString = response.body?.string().orEmpty()
                val json = runCatching { JSONObject(bodyString) }.getOrNull()

                if (response.code == 404) {
                    return LoginResult.Error(LoginError("Link not found"))
                }

                if (!response.isSuccessful) {
                    val backendMessage = json?.optString("message")?.takeIf { it.isNotBlank() }
                    val message = when (response.code) {
                        401 -> "Invalid credentials"
                        404 -> "Link not found"
                        else -> backendMessage ?: "Login failed. Please try again."
                    }
                    return LoginResult.Error(LoginError(message))
                }

                val token = json?.optString("token").orEmpty()
                val refreshToken = json?.optString("refreshToken").orEmpty()
                val studentObj = json?.optJSONObject("student")
                val accessTokenExpiresAt = json?.optString("accessTokenExpiresAt")?.takeIf { it.isNotBlank() }

                if (token.isBlank() || refreshToken.isBlank() || studentObj == null) {
                    return LoginResult.Error(LoginError("Login failed. Please try again."))
                }

                LoginResult.Success(
                    LoginSuccess(
                        token = token,
                        refreshToken = refreshToken,
                        studentJson = studentObj.toString(),
                        accessTokenExpiresAt = accessTokenExpiresAt
                    )
                )
            }
        } catch (ioError: IOException) {
            LoginResult.Error(LoginError("Unable to connect. Check your internet connection."))
        } catch (_: Exception) {
            LoginResult.Error(LoginError("Login failed. Please try again."))
        }
    }

    companion object {
        private val LOGIN_URL = WebPortalActivity.Config.getApiUrl("api/student/mobile/login")
    }
}
