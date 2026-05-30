package com.sahelagriconnect.app

import android.os.Handler
import android.os.Looper
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

/**
 * Native biometric gate using AndroidX BiometricManager.
 *
 * Authenticators: [BIOMETRIC_STRONG] | [BIOMETRIC_WEAK] for capability checks,
 * plus [DEVICE_CREDENTIAL] on the prompt so PIN/pattern/passcode work as fallback
 * (same pattern as banking apps and local_auth's AuthenticationHelper).
 */
object BiometricBridge {
    private const val CHANNEL = "com.sahelagriconnect.app/biometric"

    /** Matches BiometricManager.canAuthenticate(BIOMETRIC_STRONG | BIOMETRIC_WEAK). */
    private const val BIOMETRIC_CAPABLE =
        BiometricManager.Authenticators.BIOMETRIC_STRONG or
            BiometricManager.Authenticators.BIOMETRIC_WEAK

    /** Prompt allows face, fingerprint, and device PIN/pattern/password. */
    private const val PROMPT_AUTHENTICATORS =
        BIOMETRIC_CAPABLE or BiometricManager.Authenticators.DEVICE_CREDENTIAL

    fun register(engine: FlutterEngine, activity: FragmentActivity) {
        MethodChannel(engine.dartExecutor.binaryMessenger, CHANNEL)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "canAuthenticate" -> {
                        val bm = BiometricManager.from(activity)
                        val code = bm.canAuthenticate(BIOMETRIC_CAPABLE)
                        result.success(code == BiometricManager.BIOMETRIC_SUCCESS)
                    }
                    "hasWeakBiometric" -> {
                        val bm = BiometricManager.from(activity)
                        val code =
                            bm.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_WEAK)
                        result.success(code == BiometricManager.BIOMETRIC_SUCCESS)
                    }
                    "hasStrongBiometric" -> {
                        val bm = BiometricManager.from(activity)
                        val code =
                            bm.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)
                        result.success(code == BiometricManager.BIOMETRIC_SUCCESS)
                    }
                    "authenticate" -> {
                        val reason = call.argument<String>("reason") ?: "Confirm your identity"
                        prompt(activity, reason, result)
                    }
                    else -> result.notImplemented()
                }
            }
    }

    private fun prompt(
        activity: FragmentActivity,
        reason: String,
        result: MethodChannel.Result,
    ) {
        val executor = ContextCompat.getMainExecutor(activity)
        val promptInfo =
            BiometricPrompt.PromptInfo.Builder()
                .setTitle("Sahel AgriConnect")
                .setSubtitle(reason)
                .setAllowedAuthenticators(PROMPT_AUTHENTICATORS)
                .build()

        val biometricPrompt =
            BiometricPrompt(
                activity,
                executor,
                object : BiometricPrompt.AuthenticationCallback() {
                    override fun onAuthenticationSucceeded(
                        authResult: BiometricPrompt.AuthenticationResult,
                    ) {
                        result.success(true)
                    }

                    override fun onAuthenticationError(
                        errorCode: Int,
                        errString: CharSequence,
                    ) {
                        result.success(false)
                    }

                    override fun onAuthenticationFailed() {
                        // Keep prompt open; user can retry.
                    }
                },
            )

        Handler(Looper.getMainLooper()).post { biometricPrompt.authenticate(promptInfo) }
    }
}
