import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../../../property/presentation/pages/property_detail_page.dart';

class UserProfileScreen extends ConsumerStatefulWidget {
  final String userId;

  const UserProfileScreen({super.key, required this.userId});

  @override
  ConsumerState<UserProfileScreen> createState() => _UserProfileScreenState();
}

class _UserProfileScreenState extends ConsumerState<UserProfileScreen> {
  Map<String, dynamic>? _userData;
  List<dynamic> _userProperties = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Uint8List _base64ToImage(String base64String) {
    // Remove data:image/...;base64, prefix if present
    String base64Data = base64String;
    if (base64String.contains(',')) {
      base64Data = base64String.split(',')[1];
    }
    return base64Decode(base64Data);
  }

  Future<void> _loadUserData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final storage = SecureStorageService();
      final token = await storage.getAccessToken();

      if (token == null) {
        throw Exception('Not authenticated');
      }

      print('Loading user data for userId: ${widget.userId}');

      // Fetch user details
      final userResponse = await http.get(
        Uri.parse('${ApiConstants.baseUrl}/users/${widget.userId}'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('User response status: ${userResponse.statusCode}');
      print('User response body: ${userResponse.body}');

      if (userResponse.statusCode == 200) {
        final userData = json.decode(userResponse.body);
        setState(() {
          _userData = userData;
        });
        print('User data loaded: ${_userData?['fullName']}, email: ${_userData?['email']}');
      } else {
        throw Exception('Failed to load user: ${userResponse.statusCode}');
      }

      // Fetch user's properties
      final propertiesResponse = await http.get(
        Uri.parse(
          '${ApiConstants.baseUrl}/properties?ownerId=${widget.userId}',
        ),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('Properties response status: ${propertiesResponse.statusCode}');
      print('Properties response body: ${propertiesResponse.body}');

      if (propertiesResponse.statusCode == 200) {
        final data = json.decode(propertiesResponse.body);
        setState(() {
          _userProperties = data['properties'] ?? [];
        });
        print('Loaded ${_userProperties.length} properties');
      } else {
        print('Failed to load properties: ${propertiesResponse.statusCode}');
        // Don't throw error for properties, just set empty list
        setState(() {
          _userProperties = [];
        });
      }

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading user data: $e');
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A1929),
      body: CustomScrollView(
        slivers: [
          // App Bar with gradient
          SliverAppBar(
            expandedHeight: 200,
            floating: false,
            pinned: true,
            backgroundColor: const Color(0xFF0A1929),
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      const Color(0xFF3ABAEC).withOpacity(0.3),
                      const Color(0xFF1976D2).withOpacity(0.3),
                    ],
                  ),
                ),
                child: _isLoading
                    ? const Center(
                        child: CircularProgressIndicator(
                          color: Color(0xFF3ABAEC),
                        ),
                      )
                    : _error != null
                        ? Center(
                            child: Text(
                              'Error loading profile',
                              style: const TextStyle(color: Colors.red),
                            ),
                          )
                        : _buildProfileHeader(),
              ),
            ),
          ),

          // Content
          if (_isLoading)
            const SliverFillRemaining(
              child: Center(
                child: CircularProgressIndicator(color: Color(0xFF3ABAEC)),
              ),
            )
          else if (_error != null)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 64, color: Colors.red),
                    const SizedBox(height: 16),
                    Text(
                      _error!,
                      style: const TextStyle(color: Colors.white70),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: _loadUserData,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Retry'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF3ABAEC),
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // User Info Card
                  _buildInfoCard(),
                  const SizedBox(height: 24),

                  // Properties Section
                  Row(
                    children: [
                      const Icon(
                        Icons.business,
                        color: Color(0xFF3ABAEC),
                        size: 24,
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'Properties (${_userProperties.length})',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  if (_userProperties.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(40),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1A2332),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Center(
                        child: Column(
                          children: [
                            Icon(
                              Icons.home_work_outlined,
                              size: 64,
                              color: Colors.white.withOpacity(0.3),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No properties listed',
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.5),
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    ..._userProperties.map((property) =>
                        _buildPropertyCard(property)),
                ]),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildProfileHeader() {
    final name = _userData?['fullName'] ?? _userData?['name'] ?? 'Unknown User';
    final email = _userData?['email'] ?? '';

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 40, 20, 16),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Avatar
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [
                  const Color(0xFF3ABAEC),
                  const Color(0xFF3ABAEC).withOpacity(0.7),
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF3ABAEC).withOpacity(0.5),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: _userData?['profileImage'] != null
                ? ClipOval(
                    child: Image.network(
                      _userData!['profileImage'],
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Center(
                        child: Text(
                          name[0].toUpperCase(),
                          style: const TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  )
                : Center(
                    child: Text(
                      name[0].toUpperCase(),
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
          ),
          const SizedBox(height: 12),
          Text(
            name,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          if (email.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              email,
              style: TextStyle(
                fontSize: 13,
                color: Colors.white.withOpacity(0.7),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoCard() {
    final phone = _userData?['phone'];
    final joinedDate = _userData?['createdAt'];
    final memberSince = joinedDate != null
        ? DateTime.parse(joinedDate).year.toString()
        : 'N/A';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A2332),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF3ABAEC).withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          if (phone != null) ...[
            _buildInfoRow(Icons.phone, 'Phone', phone),
            const Divider(color: Color(0xFF2A3942), height: 32),
          ],
          _buildInfoRow(Icons.calendar_today, 'Member Since', memberSince),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFF3ABAEC).withOpacity(0.2),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: const Color(0xFF3ABAEC), size: 20),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withOpacity(0.6),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPropertyCard(dynamic property) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A2332),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF3ABAEC).withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => PropertyDetailPage(
                  propertyId: property['_id'] ?? property['id'],
                ),
              ),
            );
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Property Image
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    color: const Color(0xFF1A2332),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: property['images'] != null && (property['images'] as List).isNotEmpty
                        ? Image.memory(
                            _base64ToImage(property['images'][0]),
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Icon(
                                Icons.home_work,
                                color: Colors.white.withOpacity(0.5),
                                size: 32,
                              );
                            },
                          )
                        : Icon(
                            Icons.home_work,
                            color: Colors.white.withOpacity(0.5),
                            size: 32,
                          ),
                  ),
                ),
                const SizedBox(width: 16),
                // Property Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        property['title'] ?? 'Property',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        property['address']?['city'] ?? 'Location N/A',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white.withOpacity(0.6),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '\$${property['price']?.toStringAsFixed(0) ?? 'N/A'}',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF3ABAEC),
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.arrow_forward_ios,
                  color: Colors.white54,
                  size: 16,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
