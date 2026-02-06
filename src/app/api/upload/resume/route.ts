import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin, RESUME_BUCKET } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["application/pdf"]

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
        { error: "Invalid file type. Only PDF files are allowed." },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      )
    }

    // Generate filename with timestamp
    const timestamp = Date.now()
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `${session.user.id}/${timestamp}-${safeFileName}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Delete old resume if exists
    const { data: existingFiles } = await supabaseAdmin.storage
      .from(RESUME_BUCKET)
      .list(session.user.id)

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map((f) => `${session.user.id}/${f.name}`)
      await supabaseAdmin.storage.from(RESUME_BUCKET).remove(filesToDelete)
    }

    // Upload new resume
    const { error: uploadError } = await supabaseAdmin.storage
      .from(RESUME_BUCKET)
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
      .from(RESUME_BUCKET)
      .getPublicUrl(fileName)

    const resumeUrl = publicUrlData.publicUrl

    // Get or create portfolio
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: session.user.id },
      include: { resume: true },
    })

    if (!portfolio) {
      return NextResponse.json(
        { error: "Portfolio not found. Please create a portfolio first." },
        { status: 404 }
      )
    }

    // Update or create resume record
    if (portfolio.resume) {
      await prisma.resume.update({
        where: { id: portfolio.resume.id },
        data: {
          url: resumeUrl,
          fileName: file.name,
          fileSize: file.size,
        },
      })
    } else {
      await prisma.resume.create({
        data: {
          portfolioId: portfolio.id,
          url: resumeUrl,
          fileName: file.name,
          fileSize: file.size,
        },
      })
    }

    return NextResponse.json({
      url: resumeUrl,
      fileName: file.name,
      fileSize: file.size,
    })
  } catch (error) {
    console.error("POST /api/upload/resume error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get portfolio with resume
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: session.user.id },
      include: { resume: true },
    })

    if (!portfolio?.resume) {
      return NextResponse.json({ error: "No resume found" }, { status: 404 })
    }

    // Delete from Supabase storage
    const { data: existingFiles } = await supabaseAdmin.storage
      .from(RESUME_BUCKET)
      .list(session.user.id)

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map((f) => `${session.user.id}/${f.name}`)
      await supabaseAdmin.storage.from(RESUME_BUCKET).remove(filesToDelete)
    }

    // Delete from database
    await prisma.resume.delete({
      where: { id: portfolio.resume.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/upload/resume error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
