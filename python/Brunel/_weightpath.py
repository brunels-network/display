
__all__ = ["WeightPath"]


def _setState(state, val, default=None):
    try:
        result = state[val]
        if result:
            return result
        else:
            return default
    except Exception:
        return default


class WeightPath:
    """Holds information about the change of weight with respect to dates"""
    def __init__(self, props=None, getHook=None):
        self._getHook = getHook

        self.state = {
            "id": None,
            "start_weight": None,
            "start_date": None,
            "weight_change": None,
            "date_change": None,
            "location": None,
        }

        self.setState(props)

    def __str__(self):
        return f"Source({self.getName()})"

    def __repr__(self):
        return self.__str__()

    def getID(self):
        return self.state["id"]

    def getStartDate(self):
        return self.state["start_date"]

    def getDateChange(self):
        return self.state["date_change"]

    def getStartWeight(self):
        return self.state["start_weight"]

    def getWeightChange(self):
        return self.state["weight_change"]

    def getLocation(self):
        return self.state["location"]

    def setState(self, state):
        if not state:
            return

        from ._daterange import Date as _Date

        self.state["id"] = _setState(state, "id")
        self.state["start_date"] = _setState(state, "start_date", None)
        self.state["start_weight"] = _setState(state, "start_weight", None)
        self.state["date_change"] = _setState(state, "date_change", None)
        self.state["weight_change"] = _setState(state, "weight_change", None)
        self.state["location"] = _setState(state, "location", None)

    def toDry(self):
        return self.state

    @staticmethod
    def unDry(value):
        return WeightPath(value)

    @staticmethod
    def load(data):
        return WeightPath(data)
