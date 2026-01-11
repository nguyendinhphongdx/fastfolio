import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin, AVATAR_BUCKET } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      )
    }

    // Get file extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const fileName = `${session.user.id}/avatar.${ext}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Delete old avatar if exists (different extension)
    const { data: existingFiles } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .list(session.user.id)

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map((f) => `${session.user.id}/${f.name}`)
      await supabaseAdmin.storage.from(AVATAR_BUCKET).remove(filesToDelete)
    }

    // Upload new avatar
    const { error: uploadError } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(fileName)

    const avatarUrl = publicUrlData.publicUrl

    // Update portfolio with new avatar URL
    await prisma.portfolio.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        avatar: avatarUrl,
      },
      update: {
        avatar: avatarUrl,
      },
    })

    return NextResponse.json({ url: avatarUrl })
  } catch (error) {
    console.error("POST /api/upload/avatar error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
