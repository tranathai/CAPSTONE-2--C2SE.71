import {
  getAllGroups,
  createGroup,
  deleteGroup,
  getAllStudents,
  getAllMentors,
  updateGroup,
} from "../models/groupManagement.model.js";

/* GET GROUPS */
export async function getGroups(req, res) {
  try {
    const data = await getAllGroups();

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* GET STUDENTS */
export async function getStudentsController(req, res) {
  try {
    const data = await getAllStudents();

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* GET MENTORS */
export async function getMentorsController(req, res) {
  try {
    const data = await getAllMentors();

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* CREATE */
export async function createGroupController(req, res) {
  try {
    const {
      name,
      supervisor_id,
      topic_title,
      studentIds,
    } = req.body;

    const id = await createGroup({
      name,
      supervisor_id,
      topic_title,
      studentIds,
    });

    res.json({
      success: true,
      data: { id },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* UPDATE */
export async function updateGroupController(req, res) {
  try {
    const { id } = req.params;

    const {
      name,
      supervisor_id,
      topic_title,
      studentIds,
    } = req.body;

    await updateGroup(id, {
      name,
      supervisor_id,
      topic_title,
      studentIds,
    });

    res.json({
      success: true,
      message: "Updated",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* DELETE */
export async function deleteGroupController(req, res) {
  try {
    const { id } = req.params;

    await deleteGroup(id);

    res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}