import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';

class ChariowService {
  static const String _apiKey = "sk_zycdslzq_b83184633bd0ba58b90d63b9af585988";
  static const String _baseUrl = "https://api.chariow.com/v1/checkout";

  static const String produitVendeurPremium = "prd_ktdc6ssb";
  static const String produitDevenirChauffeur = "prd_uixhg2od";

  static Future<String> demarrerPaiement({
    required String productId,
    required String email,
    required String telephone,
    required String type, // "premium" ou "chauffeur"
    Map<String, String>? extraMetadata,
  }) async {
    final uid = FirebaseAuth.instance.currentUser?.uid ?? "";

    final response = await http.post(
      Uri.parse(_baseUrl),
      headers: {
        "Authorization": "Bearer $_apiKey",
        "Content-Type": "application/json",
      },
      body: jsonEncode({
        "product_id": productId,
        "email": email,
        "first_name": "Client",
        "last_name": "Sirius",
        "phone": {"number": telephone, "country_code": "BF"},
        "custom_metadata": {"uid": uid, "type": type, ...?extraMetadata},
      }),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['data']?['step'] == 'payment') {
      return data['data']['payment']['checkout_url'] as String;
    }
    throw Exception(data['message'] ?? "Erreur lors de la création du paiement");
  }
}