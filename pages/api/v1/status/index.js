function status(request, response) {
  response.status(200).json({ msg: "Eu sou um programador acima da média." });
}

export default status;
