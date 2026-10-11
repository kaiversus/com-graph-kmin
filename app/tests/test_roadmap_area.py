import unittest

from app.routers.roadmap import _build_role_tree


class RoadmapAreaTest(unittest.TestCase):
    def test_role_prerequisite_keeps_knowledge_area_for_collapsed_view(self):
        roadmap = _build_role_tree(
            root={"id": "role", "name": "Software Engineer", "type": "JobRole"},
            skills=[{"id": "skill", "name": "Debugging", "level": "beginner", "weight": 1}],
            prereqs=[{
                "skill_id": "skill", "prereq_id": "knowledge", "prereq_name": "Stack traces",
                "prereq_type": "Knowledge", "prereq_level": "beginner", "weight": 1,
                "area_name": "Programming Fundamentals",
            }],
            acc_map={}, know_prof={}, res_skill={}, res_know={},
            account=None, personalized=False,
        )
        concept = next(n for n in roadmap["nodes"] if n["id"] == "prereq_knowledge")
        self.assertEqual(concept["area_name"], "Programming Fundamentals")
        self.assertEqual(roadmap["groups"][0]["branches"][0]["prereq_ids"], ["prereq_knowledge"])


if __name__ == "__main__":
    unittest.main()
