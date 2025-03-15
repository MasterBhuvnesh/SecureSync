//  EXPLAINED CODE

import React, { useState, useEffect } from "react";
import { Pressable, TextInput, Alert, Platform } from "react-native";
import { View } from "@/components/Themed";
import { MonoText, PoppinsText } from "@/components/StyledText";
import { Redirect, router, Stack } from "expo-router";
import * as DocumentPicker from "expo-document-picker"; // For selecting files (e.g., GIFs)
import * as ImagePicker from "expo-image-picker"; // For selecting images
import { Image } from "expo-image"; // For displaying images/GIFs
import { supabase } from "@/lib/supabase"; // Supabase client for database and storage
import Colors from "@/constants/Colors"; // Theme colors
import { useColorScheme } from "@/components/useColorScheme"; // For dark/light theme support
import { ArrowUpTrayIcon } from "react-native-heroicons/outline"; // Icon for upload button
import { useAuth } from "@/providers/AuthProvider";

export default function EditScreen() {
  const theme = useColorScheme(); // Get the current theme (light/dark)
  const [fullname, setFullname] = useState(""); // State for user's full name
  const [dateOfBirth, setDateOfBirth] = useState(""); // State for user's date of birth
  const [profilePic, setProfilePic] = useState<string | null>(null); // State for profile picture URL
  const [uploading, setUploading] = useState(false); // State to track upload progress
  const [userData, setUserData] = useState<any>(null); // State to store user data from the database
  const { session } = useAuth(); // Get the user session from the AuthProvider
  // Redirect to login screen if user is not authenticated
  if (!session) {
    return <Redirect href="/login" />;
  }
  // Fetch user data from the `users` table when the component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser(); // Get the authenticated user

      if (user) {
        // Fetch user data from the `users` table
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          Alert.alert("Error", error.message); // Show error if fetching fails
          return;
        }

        // Update state with fetched user data
        setUserData(data);
        setFullname(data.fullname || "");
        setDateOfBirth(data.date_of_birth || "");
        setProfilePic(data.profile_pic || null);
      }
    };

    fetchUserData(); // Call the function to fetch user data
  }, []);

  // Handle image upload for mobile (for regular images like JPEG/PNG)
  const uploadProfilePicMobileImg = async () => {
    try {
      setUploading(true); // Start upload process

      // Open the image picker to select an image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Allow only images
        allowsEditing: true, // Allow cropping/editing
        aspect: [1, 1], // Square aspect ratio
        quality: 1, // Highest quality
      });

      // Check if the user canceled the picker or no image was selected
      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log("User cancelled image picker.");
        return;
      }

      const image = result.assets[0]; // Get the selected image
      if (!image.uri) {
        throw new Error("No image URI found."); // Throw error if no URI
      }

      // Convert the image to an array buffer for upload
      const arrayBuffer = await fetch(image.uri).then((res) =>
        res.arrayBuffer()
      );

      // Upload the image to Supabase Storage
      const fileExt = image.uri.split(".").pop()?.toLowerCase() || "jpeg"; // Get file extension
      const filePath = `${Date.now()}.${fileExt}`; // Create a unique file path

      const { data, error: uploadError } = await supabase.storage
        .from("profile_pics")
        .upload(filePath, arrayBuffer, {
          contentType: image.mimeType || "image/jpeg", // Set MIME type
        });

      if (uploadError) {
        throw uploadError; // Throw error if upload fails
      }

      // Get the public URL of the uploaded image
      const { data: urlData } = supabase.storage
        .from("profile_pics")
        .getPublicUrl(data.path);

      setProfilePic(urlData.publicUrl); // Update profile picture URL
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message); // Show error message
      }
    } finally {
      setUploading(false); // End upload process
    }
  };

  // Handle file upload for mobile (for GIFs)
  const uploadProfilePicMobileGif = async () => {
    try {
      setUploading(true); // Start upload process

      // Open the document picker to select a file (e.g., GIF)
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*", // Allow all image types, including GIFs
      });

      // Check if the user canceled the picker or no file was selected
      if (result.canceled) {
        console.log("User cancelled file picker.");
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        throw new Error("No file selected."); // Throw error if no file
      }

      const file = result.assets[0]; // Get the selected file
      if (!file.uri) {
        throw new Error("No file URI found."); // Throw error if no URI
      }

      // Convert the file to an array buffer for upload
      const arrayBuffer = await fetch(file.uri).then((res) =>
        res.arrayBuffer()
      );

      // Upload the file to Supabase Storage
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "gif"; // Get file extension
      const filePath = `${Date.now()}.${fileExt}`; // Create a unique file path

      const { data, error: uploadError } = await supabase.storage
        .from("profile_pics")
        .upload(filePath, arrayBuffer, {
          contentType: file.mimeType || "image/gif", // Set MIME type
        });

      if (uploadError) {
        throw uploadError; // Throw error if upload fails
      }

      // Get the public URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from("profile_pics")
        .getPublicUrl(data.path);

      setProfilePic(urlData.publicUrl); // Update profile picture URL
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message); // Show error message
      }
    } finally {
      setUploading(false); // End upload process
    }
  };

  // Handle file upload for web
  const uploadProfilePicWeb = async (file: File) => {
    try {
      setUploading(true); // Start upload process

      // Upload the file to Supabase Storage
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "gif"; // Get file extension
      const filePath = `${Date.now()}.${fileExt}`; // Create a unique file path

      const { data, error: uploadError } = await supabase.storage
        .from("profile_pics")
        .upload(filePath, file, {
          contentType: file.type || "image/gif", // Set MIME type
        });

      if (uploadError) {
        throw uploadError; // Throw error if upload fails
      }

      // Get the public URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from("profile_pics")
        .getPublicUrl(data.path);

      setProfilePic(urlData.publicUrl); // Update profile picture URL
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message); // Show error message
      }
    } finally {
      setUploading(false); // End upload process
    }
  };

  // Save user data to the database
  const handleSave = async () => {
    if (!fullname || !dateOfBirth) {
      Alert.alert("Error", "Please fill all fields"); // Validate required fields
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      Alert.alert(
        "Error",
        "Please enter a valid date in the format YYYY-MM-DD"
      );
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser(); // Get the authenticated user

    if (!user) {
      Alert.alert("Error", "User not authenticated"); // Check if user is authenticated
      return;
    }
    const username = user.email?.split("@")[0] || "user"; // Generate username from email

    // Update user data in the `users` table
    const { error } = await supabase.from("users").upsert([
      {
        id: user.id,
        username,
        email: user.email,
        fullname,
        profile_pic: profilePic,
        date_of_birth: dateOfBirth,
      },
    ]);

    if (error) {
      Alert.alert("Error", error.message); // Show error if update fails
      return;
    }

    Alert.alert("Success", "Profile updated successfully"); // Show success message
    router.replace("/"); // Navigate back to the home screen
  };

  // Show loading state while fetching user data
  if (!userData) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Colors[theme ?? "light"].background,
        }}
      >
        <Stack.Screen
          options={{
            headerShown: false,
            headerTitleStyle: { fontFamily: "SpaceMono" },
            headerStyle: {
              backgroundColor: Colors[theme ?? "light"].background,
            },
            headerTintColor: Colors[theme ?? "light"].text,
          }}
        />
        <MonoText>Loading...</MonoText>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backgroundColor: Colors[theme ?? "light"].background,
      }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={{
          width: "100%",
          backgroundColor: Colors[theme ?? "light"].background,
          borderWidth: 1,
          borderColor: Colors[theme ?? "light"].text,
          borderRadius: 15,
          padding: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        <View
          style={{
            alignSelf: "flex-end",
            backgroundColor: Colors[theme ?? "light"].text,
            padding: 10,
            borderRadius: 10,
          }}
        >
          {Platform.OS === "web" ? (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  uploadProfilePicWeb(e.target.files[0]); // Handle file upload on web
                }
              }}
              style={{ display: "none" }}
              id="fileInput"
            />
          ) : (
            <Pressable onPress={uploadProfilePicMobileGif}>
              <ArrowUpTrayIcon
                size={18}
                color={Colors[theme ?? "light"].background}
              />
            </Pressable>
          )}
          {Platform.OS === "web" && (
            <label htmlFor="fileInput">
              <ArrowUpTrayIcon
                size={18}
                color={Colors[theme ?? "light"].background}
              />
            </label>
          )}
        </View>

        <View
          style={{
            alignItems: "center",
            marginVertical: 20,
          }}
        >
          {profilePic && (
            <Image
              source={{ uri: profilePic }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                borderWidth: 2,
                borderColor: Colors[theme ?? "light"].text,
              }}
              resizeMode="contain" // Ensure GIFs are displayed correctly
            />
          )}
        </View>

        <View
          style={{
            width: "100%",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <MonoText
              style={{
                fontSize: 12,
                marginRight: 10,
                color: Colors[theme ?? "light"].text,
                width: "30%",
              }}
            >
              Full Name:
            </MonoText>
            <TextInput
              value={fullname}
              onChangeText={setFullname}
              placeholder="Enter full name"
              placeholderTextColor={Colors[theme ?? "light"].text}
              autoCapitalize="none"
              style={{
                flex: 1,
                padding: 10,
                borderBottomWidth: 1,
                borderColor: Colors[theme ?? "light"].text,
                borderRadius: 5,
                fontFamily: "Poppins",
                color: Colors[theme ?? "light"].text,
              }}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <MonoText
              style={{
                fontSize: 12,
                marginRight: 10,
                color: Colors[theme ?? "light"].text,
                width: "30%",
              }}
            >
              DOB:
            </MonoText>
            <TextInput
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors[theme ?? "light"].text}
              autoCapitalize="none"
              style={{
                flex: 1,
                padding: 10,
                borderBottomWidth: 1,
                borderColor: Colors[theme ?? "light"].text,
                borderRadius: 5,
                fontFamily: "Poppins",
                color: Colors[theme ?? "light"].text,
              }}
            />
          </View>
        </View>
      </View>

      <Pressable
        onPress={handleSave}
        style={{
          backgroundColor: Colors[theme ?? "light"].text,
          width: "50%",
          padding: 10,
          borderRadius: 15,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 20,
        }}
      >
        <MonoText
          style={{
            borderRadius: 5,
            color: Colors[theme ?? "light"].background,
          }}
        >
          Save
        </MonoText>
      </Pressable>
    </View>
  );
}
