const prisma = require('../utils/prisma');

// Valid enum values derived from Prisma schema
const VALID_STATUSES = ['applied', 'screening', 'interview', 'offer', 'rejected', 'ghosted'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

// Sortable fields whitelist (prevents injection via sortBy param)
const SORTABLE_FIELDS = ['last_updated', 'applied_date', 'company', 'role', 'status', 'priority'];

// ──────────── Get All Jobs ────────────

const getAllJobs = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      status,
      priority,
      search,
      sortBy = 'last_updated',
      sortOrder = 'desc',
      page = '1',
      limit = '10',
    } = req.query;

    // ── Build where clause ──
    const where = { user_id: userId };

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        });
      }
      where.status = status;
    }

    if (priority) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({
          message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
        });
      }
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { company: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
      ];
    }

    // ── Validate sort ──
    const resolvedSortBy = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'last_updated';
    const resolvedSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    // ── Pagination ──
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // ── Run count + data queries in parallel ──
    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy: { [resolvedSortBy]: resolvedSortOrder },
        skip,
        take: limitNum,
      }),
    ]);

    return res.status(200).json({
      jobs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('getAllJobs error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ──────────── Get Job By ID ────────────

const getJobById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const job = await prisma.job.findUnique({ where: { id } });

    if (!job || job.user_id !== userId) {
      return res.status(404).json({ message: 'Job not found' });
    }

    return res.status(200).json({ job });
  } catch (error) {
    console.error('getJobById error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ──────────── Create Job ────────────

const createJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      company,
      role,
      applied_date,
      status,
      notes,
      job_url,
      salary_range,
      location,
      priority,
    } = req.body;

    // Required field validation
    if (!company || !role || !applied_date) {
      return res.status(400).json({
        message: 'company, role, and applied_date are required',
      });
    }

    // Validate optional enums if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
      });
    }

    // Parse and validate applied_date
    const parsedDate = new Date(applied_date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid applied_date format' });
    }

    const job = await prisma.job.create({
      data: {
        user_id: userId,
        company,
        role,
        applied_date: parsedDate,
        ...(status && { status }),
        ...(priority && { priority }),
        ...(notes !== undefined && { notes }),
        ...(job_url !== undefined && { job_url }),
        ...(salary_range !== undefined && { salary_range }),
        ...(location !== undefined && { location }),
      },
    });

    return res.status(201).json({ message: 'Job created successfully', job });
  } catch (error) {
    console.error('createJob error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ──────────── Update Job ────────────

const updateJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Verify ownership before updating
    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing || existing.user_id !== userId) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const {
      company,
      role,
      applied_date,
      status,
      notes,
      job_url,
      salary_range,
      location,
      priority,
    } = req.body;

    // Validate enums if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
      });
    }

    // Build update data — only include fields that were sent
    const data = {};
    if (company !== undefined) data.company = company;
    if (role !== undefined) data.role = role;
    if (applied_date !== undefined) {
      const parsedDate = new Date(applied_date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Invalid applied_date format' });
      }
      data.applied_date = parsedDate;
    }
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (notes !== undefined) data.notes = notes;
    if (job_url !== undefined) data.job_url = job_url;
    if (salary_range !== undefined) data.salary_range = salary_range;
    if (location !== undefined) data.location = location;

    const job = await prisma.job.update({ where: { id }, data });

    return res.status(200).json({ message: 'Job updated successfully', job });
  } catch (error) {
    console.error('updateJob error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ──────────── Delete Job ────────────

const deleteJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Verify ownership before deleting
    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing || existing.user_id !== userId) {
      return res.status(404).json({ message: 'Job not found' });
    }

    await prisma.job.delete({ where: { id } });

    return res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('deleteJob error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ──────────── Update Job Status ────────────

const updateJobStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'status is required' });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    // Verify ownership before updating
    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing || existing.user_id !== userId) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Updating status triggers @updatedAt on last_updated automatically
    const job = await prisma.job.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({ message: 'Job status updated successfully', job });
  } catch (error) {
    console.error('updateJobStatus error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getAllJobs, getJobById, createJob, updateJob, deleteJob, updateJobStatus };
